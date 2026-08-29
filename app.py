# -*- coding: utf-8 -*-
"""
مصعب فون - موقع حجز آيفون 18
تطبيق ويب باستخدام Flask + SQLite
"""

from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
import sqlite3
import os
import json
import qrcode
from datetime import datetime, timedelta
import re

app = Flask(__name__)
app.secret_key = "musab-phone-super-secret-key-2026"  # غيّرها في الإنتاج

DB_PATH = os.path.join(os.path.dirname(__file__), "database.db")
QR_DIR = os.path.join(os.path.dirname(__file__), "static", "qrcodes")
os.makedirs(QR_DIR, exist_ok=True)

# ---------------------------------------------------------
# إعداد موعد الحجز: بعد 11 يوماً من الآن الساعة 7:00 مساءً
# (هذا هو موعد المؤتمر ونزول الجهاز - عدّل الرقم حسب موعدكم الفعلي)
# ---------------------------------------------------------
RESERVATION_DEADLINE = (datetime.now() + timedelta(days=11)).replace(
    hour=19, minute=0, second=0, microsecond=0
)

ADMIN_PASSWORD = "musab2026"  # كلمة مرور لوحة التحكم (غيّرها)

# ---------------------------------------------------------
# ===== إعدادات التواصل (عدّل هذي القيم بمعلومات شركتكم) =====
# ---------------------------------------------------------
COMPANY_NAME = "مصعب فون"

# رقم قسم الصيانة/الدعم الفني
MAINTENANCE_PHONE = "0922051000"

# رقم واتساب الشركة (بالصيغة الدولية بدون + وبدون صفر في البداية)
# مثال: رقم ليبي 0912345678 يصبح 218912345678
WHATSAPP_BUSINESS_NUMBER = "218922051000"  # <-- غيّر هذا الرقم إلى رقم واتساب شركتكم الفعلي

# ---------------------------------------------------------
# روابط السوشيال ميديا - عدّلها إذا تغيّرت الروابط مستقبلاً
# ---------------------------------------------------------
SOCIAL_LINKS = {
    "facebook": "https://www.facebook.com/share/19D2kWMAGM/?mibextid=wwXIfr",
    "tiktok": "https://www.tiktok.com/@tcht_?_r=1&_t=ZS-99GQnHFh3Tt",
    "instagram": "https://www.instagram.com/musab.phone?igsi=dTNwcTNwZjVlM2pl&utm_source=qr",
}

# ---------------------------------------------------------
# العملة - دينار ليبي
# ---------------------------------------------------------
CURRENCY = "د.ل"

# هل نعرض الأسعار للزوار؟ خليها False طالما الأسعار لم تُحدَّد نهائياً
# (الموقع يبقى حجزاً بدون سعر ظاهر). لما تحددوا الأسعار، غيّرها إلى True
# وعدّل أرقام "price" داخل قائمة MODELS بالأسفل بالدينار الليبي.
SHOW_PRICES = False

# ---------------------------------------------------------
# إعداد الكمية المتاحة للحجز
# ---------------------------------------------------------
TOTAL_STOCK = 100  # إجمالي عدد الأجهزة المتاحة للحجز


# ---------------------------------------------------------
# قاعدة البيانات
# ---------------------------------------------------------
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS reservations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT,
            city TEXT,
            model TEXT NOT NULL,
            color TEXT NOT NULL,
            storage TEXT NOT NULL,
            notes TEXT,
            booking_ref TEXT,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


def get_reserved_count():
    """عدد الحجوزات الحقيقية المسجّلة في قاعدة البيانات."""
    conn = get_db()
    row = conn.execute("SELECT COUNT(*) AS c FROM reservations").fetchone()
    conn.close()
    return row["c"] if row else 0


def get_stock_status():
    reserved = get_reserved_count()
    remaining = max(TOTAL_STOCK - reserved, 0)
    percent = round((reserved / TOTAL_STOCK) * 100) if TOTAL_STOCK else 0
    percent = min(percent, 100)
    return {
        "total": TOTAL_STOCK,
        "reserved": reserved,
        "remaining": remaining,
        "percent": percent,
        "sold_out": remaining <= 0,
    }


# ---------------------------------------------------------
# بيانات المنتج (موديلات وألوان وسعات آيفون 18)
# ---------------------------------------------------------
MODELS = [
    # رقم "price" هنا بالدينار الليبي - لن يظهر للزوار طالما SHOW_PRICES = False
    # لما تحددوا السعر النهائي، عدّلوا الرقم وفعّلوا SHOW_PRICES بالأعلى
    {"id": "iphone18", "name": "iPhone 18", "price": 0},
    {"id": "iphone18_pro", "name": "iPhone 18 Pro", "price": 0},
    {"id": "iphone18_pro_max", "name": "iPhone 18 Pro Max", "price": 0},
]

COLORS = ["أزرق تيتانيوم", "أبيض سماوي", "أسود فضائي", "ذهبي طبيعي", "بنفسجي داكن"]
STORAGE = ["256GB", "512GB", "1TB"]

# معرض صور الهاتف بالألوان الخمسة - الصور توضع في static/img/
# باسم الملف المحدد أدناه (راجع ملف static/img/README_IMAGES.txt للتفاصيل)
GALLERY = [
    {"color": "أزرق تيتانيوم", "file": "phone-1.jpg"},
    {"color": "أبيض سماوي", "file": "phone-2.jpg"},
    {"color": "أسود فضائي", "file": "phone-3.jpg"},
    {"color": "ذهبي طبيعي", "file": "phone-4.jpg"},
    {"color": "بنفسجي داكن", "file": "phone-5.jpg"},
]


def valid_phone(phone: str) -> bool:
    return bool(re.match(r"^\+?[0-9\s\-]{8,15}$", phone))


# ---------------------------------------------------------
# توليد رمز QR يحتوي بيانات الحجز الكاملة
# ---------------------------------------------------------
def generate_booking_qr(booking: dict) -> str:
    """
    يولّد صورة QR تحتوي على كامل بيانات الحجز، ويحفظها في static/qrcodes/
    ويرجع اسم ملف الصورة (يُستخدم لاحقاً في القالب وللطباعة عند الاستلام).
    """
    payload = {
        "الشركة": COMPANY_NAME,
        "رقم_الحجز": booking["booking_ref"],
        "الاسم": booking["full_name"],
        "الجوال": booking["phone"],
        "البريد": booking.get("email") or "-",
        "المدينة": booking.get("city") or "-",
        "الموديل": booking["model_name"],
        "اللون": booking["color"],
        "السعة": booking["storage"],
        "تاريخ_الحجز": booking["created_at"],
    }
    qr_text = json.dumps(payload, ensure_ascii=False)

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=3,
    )
    qr.add_data(qr_text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0a2540", back_color="#ffffff")

    filename = f"{booking['booking_ref']}.png"
    filepath = os.path.join(QR_DIR, filename)
    img.save(filepath)
    return filename


# ---------------------------------------------------------
# الصفحة الرئيسية
# ---------------------------------------------------------
@app.route("/", methods=["GET"])
def index():
    return render_template(
        "index.html",
        models=MODELS,
        colors=COLORS,
        storages=STORAGE,
        gallery=GALLERY,
        deadline_iso=RESERVATION_DEADLINE.isoformat(),
        deadline_readable=RESERVATION_DEADLINE.strftime("%Y-%m-%d الساعة %I:%M %p"),
        stock=get_stock_status(),
        maintenance_phone=MAINTENANCE_PHONE,
        whatsapp_number=WHATSAPP_BUSINESS_NUMBER,
        company_name=COMPANY_NAME,
        social_links=SOCIAL_LINKS,
        currency=CURRENCY,
        show_prices=SHOW_PRICES,
    )


# ---------------------------------------------------------
# استقبال الحجز
# ---------------------------------------------------------
@app.route("/reserve", methods=["POST"])
def reserve():
    full_name = request.form.get("full_name", "").strip()
    phone = request.form.get("phone", "").strip()
    email = request.form.get("email", "").strip()
    city = request.form.get("city", "").strip()
    model = request.form.get("model", "").strip()
    color = request.form.get("color", "").strip()
    storage = request.form.get("storage", "").strip()
    notes = request.form.get("notes", "").strip()

    stock = get_stock_status()

    errors = []
    if stock["sold_out"]:
        errors.append("عذراً، نفدت كامل الكمية المتاحة للحجز (100 جهاز).")
    if len(full_name) < 3:
        errors.append("الرجاء إدخال الاسم الكامل بشكل صحيح.")
    if not valid_phone(phone):
        errors.append("رقم الجوال غير صالح.")
    if model not in [m["id"] for m in MODELS]:
        errors.append("الرجاء اختيار موديل الجهاز.")
    if color not in COLORS:
        errors.append("الرجاء اختيار اللون.")
    if storage not in STORAGE:
        errors.append("الرجاء اختيار سعة التخزين.")
    if datetime.now() > RESERVATION_DEADLINE:
        errors.append("عذراً، انتهى وقت استقبال الحجوزات.")

    if errors:
        for e in errors:
            flash(e, "error")
        return redirect(url_for("index") + "#reserve")

    created_at = datetime.now().isoformat()

    conn = get_db()
    cur = conn.execute(
        """INSERT INTO reservations
           (full_name, phone, email, city, model, color, storage, notes, booking_ref, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            full_name,
            phone,
            email,
            city,
            model,
            color,
            storage,
            notes,
            "",  # سيُحدَّث بعد معرفة الـ id
            created_at,
        ),
    )
    new_id = cur.lastrowid
    booking_ref = f"MF-{new_id:05d}"
    conn.execute("UPDATE reservations SET booking_ref = ? WHERE id = ?", (booking_ref, new_id))
    conn.commit()
    conn.close()

    model_name = next((m["name"] for m in MODELS if m["id"] == model), model)

    # توليد رمز QR يحتوي كامل بيانات الحجز
    generate_booking_qr(
        {
            "booking_ref": booking_ref,
            "full_name": full_name,
            "phone": phone,
            "email": email,
            "city": city,
            "model_name": model_name,
            "color": color,
            "storage": storage,
            "created_at": created_at,
        }
    )

    flash("تم استلام حجزك بنجاح! سيتم التواصل معك قريباً من فريق " + COMPANY_NAME + ".", "success")
    return redirect(url_for("thankyou", ref=booking_ref))


@app.route("/thankyou")
def thankyou():
    ref = request.args.get("ref", "")
    booking = None
    if ref:
        conn = get_db()
        row = conn.execute("SELECT * FROM reservations WHERE booking_ref = ?", (ref,)).fetchone()
        conn.close()
        if row:
            booking = dict(row)
            booking["model_name"] = next(
                (m["name"] for m in MODELS if m["id"] == row["model"]), row["model"]
            )

    # رسالة جاهزة لواتساب الشركة (رابط click-to-chat يفتحه العميل يدوياً)
    whatsapp_link = None
    if booking:
        wa_text = (
            f"مرحباً {COMPANY_NAME}، تم تأكيد حجزي ✅\n"
            f"رقم الحجز: {booking['booking_ref']}\n"
            f"الاسم: {booking['full_name']}\n"
            f"الموديل: {booking['model_name']} - {booking['color']} - {booking['storage']}\n"
            f"للاستفسار أو الصيانة: {MAINTENANCE_PHONE}"
        )
        from urllib.parse import quote

        whatsapp_link = f"https://wa.me/{WHATSAPP_BUSINESS_NUMBER}?text={quote(wa_text)}"

    return render_template(
        "thankyou.html",
        deadline_iso=RESERVATION_DEADLINE.isoformat(),
        booking=booking,
        maintenance_phone=MAINTENANCE_PHONE,
        whatsapp_link=whatsapp_link,
        company_name=COMPANY_NAME,
        social_links=SOCIAL_LINKS,
    )


# ---------------------------------------------------------
# API: حالة المخزون (يُستخدم للتحديث الحي بدون تحديث الصفحة)
# ---------------------------------------------------------
@app.route("/api/stock")
def api_stock():
    return jsonify(get_stock_status())


# API صغير لإرجاع الوقت المتبقي (اختياري للاستخدام عبر JS)
@app.route("/api/deadline")
def api_deadline():
    return jsonify({"deadline_iso": RESERVATION_DEADLINE.isoformat()})


# ---------------------------------------------------------
# API: بيانات الرسم البياني الحي لنمو الحجوزات
# كل حجز جديد = نقطة جديدة يرتفع معها الخط
# ---------------------------------------------------------
@app.route("/api/timeline")
def api_timeline():
    conn = get_db()
    rows = conn.execute(
        "SELECT created_at FROM reservations ORDER BY created_at ASC"
    ).fetchall()
    conn.close()

    labels = []
    cumulative = []
    count = 0
    for row in rows:
        count += 1
        cumulative.append(count)
        # نعرض رقم الحجز التسلسلي فقط كتسمية (يبقى الخط يرتفع مع كل حجز)
        labels.append(f"#{count}")

    return jsonify({"labels": labels, "values": cumulative, "total": count})


# ---------------------------------------------------------
# لوحة تحكم بسيطة لعرض الحجوزات
# ---------------------------------------------------------
@app.route("/admin", methods=["GET", "POST"])
def admin():
    if request.method == "POST":
        password = request.form.get("password", "")
        if password == ADMIN_PASSWORD:
            session["is_admin"] = True
        else:
            flash("كلمة المرور غير صحيحة.", "error")
            return redirect(url_for("admin"))

    if not session.get("is_admin"):
        return render_template("admin_login.html", social_links=SOCIAL_LINKS)

    conn = get_db()
    rows = conn.execute("SELECT * FROM reservations ORDER BY id DESC").fetchall()
    conn.close()

    model_names = {m["id"]: m["name"] for m in MODELS}
    return render_template(
        "admin.html",
        reservations=rows,
        model_names=model_names,
        stock=get_stock_status(),
        social_links=SOCIAL_LINKS,
    )


@app.route("/admin/logout")
def admin_logout():
    session.pop("is_admin", None)
    return redirect(url_for("admin"))


@app.route("/admin/delete/<int:res_id>", methods=["POST"])
def admin_delete(res_id):
    if not session.get("is_admin"):
        return redirect(url_for("admin"))
    conn = get_db()
    conn.execute("DELETE FROM reservations WHERE id = ?", (res_id,))
    conn.commit()
    conn.close()
    return redirect(url_for("admin"))


if __name__ == "__main__":
    init_db()
    app.run(debug=True, host="0.0.0.0", port=5000)
