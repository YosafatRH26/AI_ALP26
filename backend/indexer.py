import os
import requests
import PyPDF2
import io
import time
import urllib3
import google.generativeai as genai
from supabase import create_client, Client
from dotenv import load_dotenv  # Import library untuk baca .env

# Load environment variables dari file .env
load_dotenv()

# Nonaktifkan peringatan SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ==========================================
# 1. KONFIGURASI (AMAN)
# ==========================================

# Ambil credential dari file .env
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Validasi agar script tidak jalan kalau key kosong
if not SUPABASE_URL or not SUPABASE_KEY or not GEMINI_API_KEY:
    print("❌ ERROR FATAL: API Key belum ditemukan!")
    print("   Pastikan Anda sudah membuat file '.env' di dalam folder backend")
    print("   dan mengisinya dengan SUPABASE_URL, SUPABASE_KEY, dan GEMINI_API_KEY.")
    exit(1)

# Inisialisasi Client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    genai.configure(api_key=GEMINI_API_KEY)
    print("✅ Koneksi Backend Siap (Menggunakan Credentials Aman)!")
except Exception as e:
    print(f"❌ Error Config: {e}")
    exit(1)

# URL Katalog
CATALOG_URL = "https://api.buku.cloudapp.web.id/api/catalogue/getTextBooks?limit=2000&type_pdf&order_by=updated_at"

# ==========================================
# 2. FUNGSI UTAMA
# ==========================================

def fetch_catalog():
    """Mengambil daftar semua buku"""
    print(f"📡 Mengambil katalog dari: {CATALOG_URL}...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://buku.kemendikdasmen.go.id'
    }
    try:
        resp = requests.get(CATALOG_URL, headers=headers, verify=False)
        if resp.status_code == 200:
            data = resp.json()
            results = data.get('results', data)
            print(f"📚 Total buku di server: {len(results)}")
            return results
        return []
    except Exception as e:
        print(f"❌ Gagal ambil katalog: {e}")
        return []

def get_book_detail(slug):
    """Mengambil link PDF spesifik"""
    url = f"https://api.buku.cloudapp.web.id/api/catalogue/getDetails?slug={slug}"
    headers = {'User-Agent': 'Mozilla/5.0', 'Origin': 'https://buku.kemendikdasmen.go.id'}
    try:
        resp = requests.get(url, headers=headers, verify=False)
        if resp.status_code == 200:
            return resp.json().get('results', {})
    except:
        return {}
    return {}

def process_and_upload_book(book_meta):
    """Download PDF, Potong Teks, Embed, Upload ke Supabase"""
    title = book_meta.get('title')
    pdf_url = book_meta.get('attachment')
    level = book_meta.get('level', 'UMUM')

    if not pdf_url:
        print(f"   ⚠️ Skip: Tidak ada PDF untuk {title}")
        return

    print(f"   📥 Downloading: {title}...")
    try:
        resp = requests.get(pdf_url, verify=False, timeout=60)
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(resp.content))

        # LIMIT HALAMAN (Ubah [:10] jadi halaman penuh jika sudah siap)
        pages_to_process = pdf_reader.pages[:10]
        print(f"   📖 Memproses {len(pages_to_process)} halaman awal...")

        for i, page in enumerate(pages_to_process):
            text = page.extract_text()
            if text and len(text) > 150:
                clean_text = text.replace('\n', ' ').strip()

                # --- RETRY LOGIC UNTUK EMBEDDING ---
                for attempt in range(3):
                    try:
                        # 1. Embed
                        embedding_result = genai.embed_content(
                            model="models/text-embedding-004",
                            content=clean_text,
                            task_type="retrieval_document",
                            title=title
                        )
                        
                        # 2. Upload
                        payload = {
                            "content": clean_text,
                            "metadata": {
                                "title": title,
                                "page": i + 1,
                                "jenjang": level,
                                "source": "Kemendikbud SIBI"
                            },
                            "embedding": embedding_result['embedding']
                        }
                        
                        supabase.table("documents").insert(payload).execute()
                        print(f"      ✅ Hal {i+1} OK.")
                        time.sleep(2) # Jeda agar tidak kena limit
                        break 
                    
                    except Exception as e:
                        if "429" in str(e):
                            print(f"      ⏳ Limit Google (429). Tunggu 10s...")
                            time.sleep(10)
                        else:
                            print(f"      ❌ Error Hal {i+1}: {e}")
                            break

    except Exception as e:
        print(f"   ❌ Gagal proses PDF: {e}")

# ==========================================
# 3. EKSEKUSI UTAMA
# ==========================================

if __name__ == "__main__":
    # 1. Ambil Katalog
    all_books = fetch_catalog()

    # 2. Setting Target
    TARGET_JENJANG = "SMA"
    print(f"\n🎯 Target Operasi: Mengambil buku jenjang '{TARGET_JENJANG}'")

    count = 0
    MAX_BOOKS = 5 # Batasi 5 buku untuk tes

    for book in all_books:
        if count >= MAX_BOOKS:
            print("\n🛑 Batas jumlah buku tercapai. Berhenti.")
            break

        slug = book.get('slug')
        detail = get_book_detail(slug)
        
        if detail:
            level_buku = detail.get('level', '').upper()
            judul_buku = detail.get('title', '')

            if TARGET_JENJANG in level_buku:
                print(f"\n[{count+1}] Memproses: {judul_buku} ({level_buku})")
                process_and_upload_book(detail)
                count += 1
            else:
                pass