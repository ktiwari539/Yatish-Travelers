#!/usr/bin/env python3
"""Fetch ORIGINAL licensed vehicle photographs to a CI audit artifact.

Do not write the originals into the public website or replace URLs until their
registration plates have been permanently redacted and derivative licensing
has been reviewed.
"""
from pathlib import Path
import hashlib
import json
import urllib.parse
import urllib.request
import time

FILES = {
  "mahindra-thar-original.jpg":
    'Mahindra Thar SUV in "Red Rage" color at Ashiana Brahmanda, East Singbhum India (Ank Kumar, Infosys limited) 02 (cropped).jpg',
  "mahindra-xuv700-original.jpg":
    'A black Mahindra XUV700 SUV in Ashiana Brahmananda, Jamshedpur, India (Ank Kumar, Infosys Limited) 02.jpg',
  "tempo-traveller-original.jpg": 'Force Traveller Luxury.jpg',
}
DEST = Path("artifacts/privacy-sources")
DEST.mkdir(parents=True,exist_ok=True)

def get(url):
  req=urllib.request.Request(url,headers={
    "User-Agent":"MateshwariVehicleImagePrivacyAudit/1.0 (website asset quality assurance)",
    "Accept":"image/jpeg,image/*;q=0.9,*/*;q=0.7",
  })
  with urllib.request.urlopen(req,timeout=40) as response:
    data=response.read(18_000_000)
    if not (data.startswith(bytes.fromhex("ffd8ff")) and 50000<len(data)<18_000_000):
      raise ValueError("unexpected response content or file size")
    return data, response.url

records=[]
for output,filename in FILES.items():
  basename=filename.replace(" ","_")
  folder=hashlib.md5(basename.encode("utf-8")).hexdigest()
  encoded=urllib.parse.quote(basename,safe="(),'")
  urls=[
    "https://commons.wikimedia.org/wiki/Special:FilePath/"+encoded,
    f"https://upload.wikimedia.org/wikipedia/commons/{folder[0]}/{folder[:2]}/{encoded}",
  ]
  errors=[]
  for url in urls:
    try:
      data,final=get(url)
      (DEST/output).write_bytes(data)
      records.append({
        "filename":output,"original":filename,
        "source_page":"https://commons.wikimedia.org/wiki/File:"+encoded,
        "downloaded_from":final,
        "sha256":hashlib.sha256(data).hexdigest(),
        "bytes":len(data),
      })
      print(f"DOWNLOAD OK {output} {len(data)} bytes",flush=True)
      break
    except Exception as e:
      errors.append(str(e))
      time.sleep(1)
  else:
    raise RuntimeError(f"Failed {filename}: {errors}")
(DEST/"sources.json").write_text(json.dumps(records,indent=2))
