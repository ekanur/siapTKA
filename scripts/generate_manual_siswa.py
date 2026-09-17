import os
import shutil
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        page_num = self._pageNumber
        self.saveState()

        # Footer on all pages
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(36, 30, A4[0] - 36, 30)
        
        self.drawString(36, 18, "SiapTKA • SMKN 2 Depok Sleman • Panduan Penggunaan Siswa")
        page_str = f"Halaman {page_num} dari {page_count}"
        self.drawRightString(A4[0] - 36, 18, page_str)

        # Header on pages after cover
        if page_num > 1:
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#1e3a8a"))
            self.drawString(36, A4[1] - 25, "SIAPTKA — PANDUAN PENGGUNAAN SISWA")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#94a3b8"))
            self.drawRightString(A4[0] - 36, A4[1] - 25, "Persiapan Mandiri TKA Siswa PKL")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(36, A4[1] - 30, A4[0] - 36, A4[1] - 30)

        self.restoreState()

def build_pdf():
    os.makedirs("docs", exist_ok=True)
    os.makedirs("public/docs", exist_ok=True)
    pdf_filename = "docs/Panduan_Penggunaan_SiapTKA_Siswa.pdf"
    
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=38,
        bottomMargin=42
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor("#0f172a")      # Slate 900
    NAVY = colors.HexColor("#1e3a8a")         # Blue 900
    BLUE = colors.HexColor("#2563eb")         # Blue 600
    DARK_TEXT = colors.HexColor("#1e293b")    # Slate 800
    MUTED_TEXT = colors.HexColor("#475569")   # Slate 600
    BG_LIGHT = colors.HexColor("#f8fafc")     # Slate 50
    CARD_BG = colors.HexColor("#f1f5f9")      # Slate 100
    BORDER_COLOR = colors.HexColor("#e2e8f0") # Slate 200
    ALERT_BG = colors.HexColor("#eff6ff")     # Blue 50
    ALERT_BORDER = colors.HexColor("#bfdbfe") # Blue 200

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=NAVY,
        alignment=0,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=MUTED_TEXT,
        alignment=0,
        spaceAfter=10
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=12.5,
        leading=16,
        textColor=NAVY,
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=BLUE,
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=DARK_TEXT,
        spaceAfter=4
    )

    body_bold = ParagraphStyle(
        'Body_Bold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2.5
    )

    callout_style = ParagraphStyle(
        'Callout_Text',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=DARK_TEXT
    )

    story = []

    # ==========================================
    # HALAMAN 1: IDENTITAS & FITUR UTAMA
    # ==========================================
    logo_icon_path = "public/logo/icon-only.png"
    logo_h_path = "public/logo/horizontal.png"
    
    header_table_data = [
        [
            RLImage(logo_icon_path, width=28, height=38),
            RLImage(logo_h_path, width=115, height=38),
            Paragraph(
                "<font size=8 color='#64748b'><b>SMKN 2 DEPOK SLEMAN</b><br/>"
                "Persiapan Mandiri TKA Siswa PKL<br/>"
                "<i>Tahun Pelaksanaan 2026</i></font>",
                ParagraphStyle('TopRight', alignment=2, leading=11)
            )
        ]
    ]
    header_table = Table(header_table_data, colWidths=[36, 125, 362])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.5, color=BLUE, spaceBefore=0, spaceAfter=8))

    story.append(Paragraph("PANDUAN PENGGUNAAN APLIKASI SIAPTKA", title_style))
    story.append(Paragraph(
        "<b>Petunjuk Praktis & Panduan Lengkap Bagi Siswa Praktik Kerja Lapangan (PKL)</b><br/>"
        "Platform Latihan Tes Kemampuan Akademik (TKA) Mandiri Berbasis Offline-First & Progressive Web App",
        subtitle_style
    ))

    # Overview Card
    card_data = [
        [
            Paragraph("<b>Sasaran Pengguna:</b>", body_bold),
            Paragraph("Siswa Kelas XII & XIII SMKN 2 Depok Sleman yang sedang melaksanakan PKL di Industri", body_style),
        ],
        [
            Paragraph("<b>Akses Aplikasi:</b>", body_bold),
            Paragraph("Web Browser HP / Laptop (Chrome, Safari, Edge) via Google Workspace SSO Sekolah", body_style),
        ],
        [
            Paragraph("<b>Keunggulan:</b>", body_bold),
            Paragraph("<b>Offline-First Synchronizer:</b> Tetap bisa latihan tanpa internet di area industri, tersinkronisasi otomatis saat online.", body_style),
        ],
        [
            Paragraph("<b>Mata Pelajaran:</b>", body_bold),
            Paragraph("Bahasa Indonesia, Matematika, Bahasa Inggris, dan Mata Pelajaran Pilihan Kejuruan.", body_style),
        ]
    ]
    overview_table = Table(card_data, colWidths=[100, 423])
    overview_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 0.8, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(overview_table)
    story.append(Spacer(1, 8))

    # BAB 1: FITUR UTAMA
    story.append(Paragraph("1. Fitur Unggulan SiapTKA Bagi Siswa PKL", h1_style))
    story.append(Paragraph(
        "Aplikasi SiapTKA dirancang khusus dengan memperhatikan kendala nyata yang dihadapi siswa selama berada di lokasi industri, terutama keterbatasan kuota/sinyal dan kesibukan jam kerja PKL. Berikut fitur-fitur kunci yang tersedia:",
        body_style
    ))

    features = [
        ("A. Mode Latihan Offline Penuh (Offline-First)",
         "Siswa cukup melakukan <b>sekali unduh bank soal</b> di awal saat ada jaringan internet. Setelah itu, latihan soal dapat dikerjakan secara offline kapan saja tanpa memerlukan kuota data atau koneksi internet. Semua jawaban tersimpan aman di peramban lokal (IndexedDB)."),
        ("B. Sinkronisasi Progres Otomatis (Background Auto-Sync)",
         "Ketika perangkat Anda kembali terhubung ke internet (Wi-Fi kos, rumah, atau seluler), sistem akan otomatis mengirimkan riwayat pengerjaan soal dan menghitung capaian progres ke server sekolah tanpa perlu langkah manual yang rumit."),
        ("C. Progressive Web App (PWA) - Pasang di Layar Depan HP",
         "Aplikasi dapat dipasang (*install*) langsung ke layar beranda ponsel Android maupun iPhone layaknya aplikasi native tanpa perlu mengunduh dari Google Play Store."),
        ("D. Konfirmasi Mata Pelajaran Pilihan Kejuruan",
         "Memungkinkan siswa memverifikasi data diri, status kesiapan mengikuti TKA, serta memilih mata pelajaran kejuruan yang sesuai dengan kompetensi keahlian masing-masing."),
        ("E. Diagnostik Mandiri & Pembahasan Kunci Jawaban",
         "Tersedia fitur penanda soal ragu-ragu, timer latihan fleksibel, serta kunci jawaban dan pembahasan komprehensif setelah latihan selesai untuk evaluasi mandiri.")
    ]

    for f_title, f_desc in features:
        box_data = [[
            Paragraph(f"<b>{f_title}</b>", ParagraphStyle('FTitle', parent=body_bold, textColor=NAVY)),
        ], [
            Paragraph(f_desc, body_style)
        ]]
        t_box = Table(box_data, colWidths=[523])
        t_box.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
            ('BOX', (0,0), (-1,-1), 0.6, BORDER_COLOR),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ]))
        story.append(t_box)
        story.append(Spacer(1, 3))

    # Page Break ke Halaman 2
    story.append(PageBreak())

    # ==========================================
    # HALAMAN 2: ALUR PENGGUNAAN (STEP BY STEP)
    # ==========================================
    story.append(Paragraph("2. Alur & Langkah Penggunaan SiapTKA", h1_style))
    story.append(Paragraph(
        "Ikuti 5 langkah mudah berikut untuk memulai persiapan dan latihan asesmen mandiri:",
        body_style
    ))

    # Step 1
    story.append(Paragraph("Langkah 1: Masuk ke Akun (Login Siswa Google SSO)", h2_style))
    story.append(Paragraph(
        "&bull; Buka peramban di ponsel atau laptop, lalu akses alamat web portal SiapTKA.<br/>"
        "&bull; Pada halaman depan login, pilih tab <b>Login Siswa</b>.<br/>"
        "&bull; Klik tombol <b>'Masuk dengan Akun Google'</b> dan pilih email resmi sekolah yang telah didaftarkan.<br/>"
        "&bull; <i>Catatan:</i> Pastikan login menggunakan akun Google yang terdata di sekolah agar nama, NIS, kelas, dan jurusan Anda langsung terhubung otomatis.",
        bullet_style
    ))

    # Step 2
    story.append(Paragraph("Langkah 2: Konfirmasi Keikutsertaan TKA & Verifikasi Data PKL", h2_style))
    story.append(Paragraph(
        "&bull; Setelah login pertama kali, Anda akan diarahkan ke halaman <b>Konfirmasi TKA</b>.<br/>"
        "&bull; Periksa data profil Anda: <b>NIS, Nama Lengkap, Kelas, Jurusan</b>, dan <b>Tempat Industri PKL</b>.<br/>"
        "&bull; Pilih status kesiapan keikutsertaan pada opsi <b>'Konfirmasi Ikut TKA'</b>.<br/>"
        "&bull; Pada bagian mata pelajaran pilihan kejuruan, pilih mata pelajaran kejuruan yang akan Anda ikuti.<br/>"
        "&bull; Klik tombol <b>'Simpan Konfirmasi'</b>. Setelah konfirmasi tersimpan, tombol <b>'Mulai Latihan Mandiri'</b> akan aktif.",
        bullet_style
    ))

    # Step 3
    story.append(Paragraph("Langkah 3: Mengunduh Bank Soal untuk Latihan Offline di Tempat PKL", h2_style))
    story.append(Paragraph(
        "&bull; Masuk ke menu <b>Latihan Hub</b>.<br/>"
        "&bull; Anda akan melihat kartu ringkasan progres belajar untuk masing-masing mata pelajaran.<br/>"
        "&bull; Jika status mata pelajaran masih bertuliskan <i>'Belum Offline'</i>, klik tombol <b>'Unduh Bank Soal'</b> pada bagian atas.<br/>"
        "&bull; Sistem akan menyalin seluruh bank butir soal ke penyimpanan peramban lokal perangkat Anda.<br/>"
        "&bull; Setelah selesai, muncul tanda centang hijau <b>'Siap Offline'</b>. Anda kini siap mengerjakan latihan di mana saja tanpa kuota internet!",
        bullet_style
    ))

    # Tips Box
    tip_data = [[
        Paragraph(
            "<b>TIPS PENTING SISWA PKL:</b><br/>"
            "Lakukan unduh bank soal saat Anda sedang berada di area dengan Wi-Fi stabil (misal: di asrama/kos atau kantor). "
            "Setelah bank soal tersimpan, Anda dapat mematikan data seluler dan mengerjakan soal dengan tenang di sela waktu istirahat kerja industri.",
            callout_style
        )
    ]]
    tip_table = Table(tip_data, colWidths=[523])
    tip_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), ALERT_BG),
        ('BOX', (0,0), (-1,-1), 0.8, ALERT_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(Spacer(1, 2))
    story.append(tip_table)
    story.append(Spacer(1, 6))

    # Step 4
    story.append(Paragraph("Langkah 4: Mengerjakan Soal Latihan & Fitur Pendukung Ujian", h2_style))
    story.append(Paragraph(
        "&bull; Klik tombol <b>'Mulai Latihan'</b> pada mata pelajaran yang diinginkan.<br/>"
        "&bull; <b>Navigasi Butir Soal:</b> Gunakan panel nomor soal untuk melompat antar nomor soal secara bebas.<br/>"
        "&bull; <b>Fitur Ragu-Ragu:</b> Jika belum yakin dengan opsi pilihan, klik 'Tandai Ragu-ragu' (warna kuning) untuk diperiksa kembali sebelum selesai.<br/>"
        "&bull; <b>Timer Latihan:</b> Membantu Anda mengukur kecepatan dan manajemen waktu pengerjaan soal.<br/>"
        "&bull; <b>Sinyal Hilang saat Latihan?</b> Jangan khawatir! Indikator di sudut layar otomatis beralih ke 'Mode Offline'. Jawaban Anda tetap tersimpan utuh di memori HP.",
        bullet_style
    ))

    # Step 5
    story.append(Paragraph("Langkah 5: Menyelesaikan Latihan, Nilai, & Pembahasan Soal", h2_style))
    story.append(Paragraph(
        "&bull; Setelah selesai menjawab butir soal, klik tombol <b>'Selesai & Kumpulkan'</b>.<br/>"
        "&bull; Skor capaian, jumlah benar, dan jumlah salah akan langsung ditampilkan di layar.<br/>"
        "&bull; Buka tab <b>Pembahasan Soal</b> untuk mempelajari penjelasan lengkap dan konsep kunci jawaban dari para guru pengampu.<br/>"
        "&bull; Data jumlah soal yang telah dikerjakan akan langsung terakumulasi pada ProgressBar progres latihan Anda.",
        bullet_style
    ))

    # Page Break ke Halaman 3
    story.append(PageBreak())

    # ==========================================
    # HALAMAN 3: PWA, FAQ, & KONTAK
    # ==========================================
    story.append(Paragraph("3. Panduan Instalasi Aplikasi ke Smartphone (PWA)", h1_style))
    story.append(Paragraph(
        "Agar aplikasi SiapTKA dapat dibuka secara cepat satu kali klik tanpa perlu membuka peramban terlebih dahulu, pasang aplikasi ke layar depan smartphone Anda:",
        body_style
    ))

    pwa_data = [
        [
            Paragraph("<b>Ponsel Android (Google Chrome)</b>", ParagraphStyle('PWA_H', parent=body_bold, textColor=BLUE)),
            Paragraph("<b>Ponsel iPhone / iPad (Safari)</b>", ParagraphStyle('PWA_H2', parent=body_bold, textColor=BLUE)),
        ],
        [
            Paragraph(
                "1. Buka tautan SiapTKA di <b>Google Chrome</b>.<br/>"
                "2. Tekan ikon <b>titik tiga (Menu)</b> di pojok kanan atas.<br/>"
                "3. Pilih menu <b>'Tambahkan ke Layar Utama'</b> atau <b>'Instal Aplikasi'</b>.<br/>"
                "4. Konfirmasi dengan menekan tombol <b>'Instal'</b>.<br/>"
                "5. Logo pita 3D SiapTKA akan muncul di daftar aplikasi HP Anda.",
                ParagraphStyle('PWA_Body1', parent=body_style, fontSize=8, leading=12)
            ),
            Paragraph(
                "1. Buka tautan SiapTKA di peramban <b>Safari</b>.<br/>"
                "2. Tekan tombol <b>Bagikan (Share)</b> bergambar kotak panah ke atas di bilah bawah.<br/>"
                "3. Gulir menu ke bawah dan pilih <b>'Tambahkan ke Layar Utama' (Add to Home Screen)</b>.<br/>"
                "4. Tekan <b>'Tambah' (Add)</b> di sudut kanan atas.<br/>"
                "5. Aplikasi siap dibuka kapan saja dari layar beranda iPhone.",
                ParagraphStyle('PWA_Body2', parent=body_style, fontSize=8, leading=12)
            )
        ]
    ]
    pwa_table = Table(pwa_data, colWidths=[255, 255])
    pwa_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 0.8, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(pwa_table)
    story.append(Spacer(1, 10))

    # BAB 4: FAQ
    story.append(Paragraph("4. Pertanyaan yang Sering Diajukan (FAQ)", h1_style))

    faq_items = [
        ("Q: Saat login muncul pesan 'Email belum terdaftar'?",
         "A: Pastikan Anda login menggunakan email Google yang didaftarkan ke sekolah. Jika masih berkendala, segera laporkan ke guru pembimbing PKL Anda atau Administrator TKA sekolah untuk menambahkan akun Anda ke Master Siswa."),
        ("Q: Apakah jawaban saya akan hilang jika kuota internet habis saat sedang latihan?",
         "A: Tidak akan hilang. Selama Anda sudah mengunduh bank soal, aplikasi beroperasi secara offline penuh. Jawaban Anda tersimpan aman di peramban lokal dan otomatis dikirim saat HP kembali mendapatkan internet."),
        ("Q: Apakah saya boleh mengulang latihan soal mata pelajaran yang sama?",
         "A: Tentu saja boleh. Anda disarankan mengulang latihan sesering mungkin untuk memperdalam penguasaan materi dan memahami variasi soal sebelum asesmen resmi sekolah."),
        ("Q: Bagaimana cara memastikan progres latihan saya sudah tercatat oleh guru?",
         "A: Cukup hubungkan HP Anda ke internet dan buka halaman Latihan Hub. Sistem akan otomatis menyinkronkan data. Jika persentase progres bertambah dan antrean tersisa 0, data Anda sudah 100% aman tercatat di server sekolah.")
    ]

    for q, a in faq_items:
        faq_box = [
            [Paragraph(f"<b>{q}</b>", ParagraphStyle('Q', parent=body_bold, textColor=NAVY, fontSize=8.5))],
            [Paragraph(a, ParagraphStyle('A', parent=body_style, textColor=DARK_TEXT, fontSize=8, leading=11.5))]
        ]
        t_faq = Table(faq_box, colWidths=[523])
        t_faq.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
            ('LINELEFT', (0,0), (0,-1), 2.5, BLUE),
            ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
            ('TOPPADDING', (0,0), (-1,-1), 3.5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(t_faq)
        story.append(Spacer(1, 3))

    story.append(Spacer(1, 8))

    # LEMBAR PENUTUP
    closing_data = [[
        Paragraph(
            "<b>TIM ASESMEN & PERSIAPAN TKA SMKN 2 DEPOK SLEMAN</b><br/>"
            "<font size=7.5 color='#475569'>"
            "Alamat: Mrican, Caturtunggal, Depok, Sleman, D.I. Yogyakarta 55281<br/>"
            "Portal Aplikasi: <i>https://siaptka.smkn2depoksleman.sch.id</i> • Konsultasi Kendala: Guru Pembimbing PKL & Tim IT Sekolah"
            "</font>",
            ParagraphStyle('Closing', alignment=1, leading=11)
        )
    ]]
    closing_table = Table(closing_data, colWidths=[523])
    closing_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 0.8, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(closing_table)

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF berhasil dibuat: {pdf_filename}")

    # Salin ke public/docs agar bisa diunduh via web jika diperlukan
    public_target = "public/docs/Panduan_Penggunaan_SiapTKA_Siswa.pdf"
    shutil.copyfile(pdf_filename, public_target)
    print(f"PDF disalin ke web root: {public_target}")

    # Salin ke direktori artefak agar dapat diakses user
    artifact_dir = "C:/Users/Hewlett-Packard/.gemini/antigravity/brain/e5358908-4100-497e-9124-61d88a46f3c9"
    artifact_target = os.path.join(artifact_dir, "Panduan_Penggunaan_SiapTKA_Siswa.pdf")
    shutil.copyfile(pdf_filename, artifact_target)
    print(f"PDF disalin ke artefak: {artifact_target}")

if __name__ == '__main__':
    build_pdf()
