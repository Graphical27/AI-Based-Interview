import sys
sys.path.append(r"C:\Games\!Projects\AI-Based-Interview\fastapi_backend\tts\VieNeu-TTS")

from pathlib import Path
from vieneu_tts import VieNeuTTS
from utils.normalize_text import VietnameseTTSNormalizer
import soundfile as sf
from huggingface_hub import hf_hub_download

# download GGUF model to local cache (or set local_path to a pre-downloaded file)
gguf_path = hf_hub_download(
    repo_id="mradermacher/VieNeu-TTS-i1-GGUF",
    filename="VieNeu-TTS.i1-Q4_K_M.gguf",
    repo_type="model"
)

ref_audio = "sample/id_0001.wav"
ref_text = Path("sample/id_0001.txt").read_text(encoding="utf-8")

normalizer = VietnameseTTSNormalizer()
ref_text_norm = normalizer.normalize(ref_text)

tts = VieNeuTTS(
    backbone_repo=str(gguf_path),      # point to the downloaded .gguf file
    backbone_device="cuda",
    codec_repo="neuphonic/neucodec",
    codec_device="cuda"
)

ref_codes = tts.encode_reference(ref_audio)

text = "Hye i'm jhon"
text_norm = normalizer.normalize(text)

wav = tts.infer(text_norm, ref_codes, ref_text_norm)
sf.write("output.wav", wav, 24000)