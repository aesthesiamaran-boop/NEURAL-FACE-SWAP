# Neural Face Swap — by Scientific Tamil Nadu
## Build the Windows installer (no Windows PC needed)
1. Create a GitHub repo, upload this folder, open Actions > "Build Windows installer" > Run workflow.
2. Download the .exe from the run's artifacts.
## Run locally on Windows (dev)
pip install -r engine/requirements.txt ; put inswapper_128.onnx + GFPGANv1.4.onnx in models/, buffalo_l in models/models/buffalo_l ; npm install ; npm start
