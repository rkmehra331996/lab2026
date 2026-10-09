#!/usr/bin/env python3
import os
import sys
import shutil
import zipfile

def package_hostinger():
    root_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    dist_dir = os.path.join(root_dir, 'dist')
    public_dir = os.path.join(root_dir, 'public')
    
    if not os.path.exists(dist_dir):
        print(f"[ERROR] Dist directory '{dist_dir}' not found. Run 'vite build' first.")
        sys.exit(1)
        
    index_html = os.path.join(dist_dir, 'index.html')
    if not os.path.exists(index_html):
        print(f"[ERROR] 'index.html' not found in dist. Build may have failed.")
        sys.exit(1)

    # Ensure public/.htaccess and public/api are copied to dist if not already there
    htaccess_src = os.path.join(public_dir, '.htaccess')
    htaccess_dst = os.path.join(dist_dir, '.htaccess')
    if os.path.exists(htaccess_src) and not os.path.exists(htaccess_dst):
        shutil.copy2(htaccess_src, htaccess_dst)

    # Target zip outputs
    zip_root_path = os.path.join(root_dir, 'hostinger_public_html.zip')
    zip_public_path = os.path.join(public_dir, 'indianalala_hostinger_build.zip')
    zip_dist_path = os.path.join(dist_dir, 'indianalala_hostinger_build.zip')

    # Remove temporary previous zip files if they exist in dist before creating the archive
    if os.path.exists(zip_dist_path):
        os.remove(zip_dist_path)

    print(f"📦 Packaging fresh Hostinger build from '{dist_dir}'...")

    # Create root zip file
    file_count = 0
    with zipfile.ZipFile(zip_root_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for foldername, subfolders, filenames in os.walk(dist_dir):
            for filename in filenames:
                # Do not include the zip itself inside the zip
                if filename.endswith('.zip'):
                    continue
                file_path = os.path.join(foldername, filename)
                rel_path = os.path.relpath(file_path, dist_dir)
                zf.write(file_path, arcname=rel_path)
                file_count += 1

    # Copy to public/ and dist/
    shutil.copy2(zip_root_path, zip_public_path)
    shutil.copy2(zip_root_path, zip_dist_path)
    shutil.copy2(zip_root_path, os.path.join(public_dir, 'hostinger_public_html.zip'))
    shutil.copy2(zip_root_path, os.path.join(dist_dir, 'hostinger_public_html.zip'))

    size_mb = os.path.getsize(zip_root_path) / (1024 * 1024)
    print(f"✅ Successfully packaged {file_count} files into Hostinger Build Zip:")
    print(f"   1. {zip_root_path} ({size_mb:.2f} MB)")
    print(f"   2. {zip_public_path}")
    print(f"   3. {zip_dist_path}")

if __name__ == '__main__':
    package_hostinger()
