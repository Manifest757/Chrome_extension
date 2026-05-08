// ── Recording State ──
let mediaRecorder = null;
let recordedChunks = [];
let mediaStream = null;

// ── Message Handler ──
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case 'stitchImages':
      stitchImages(msg.params).then((dataUrl) => {
        sendResponse({ dataUrl });
      });
      return true;

    case 'startRecording':
      startRecording(msg.streamId, msg.type).then(sendResponse);
      return true;

    case 'stopRecording':
      stopRecording().then(sendResponse);
      return true;
  }
});

// ── Image Stitching ──
async function stitchImages(params) {
  const { captures, scrollPositions, totalHeight, viewportHeight, viewportWidth, devicePixelRatio, format } = params;

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const scaledWidth = Math.round(viewportWidth * devicePixelRatio);
  const scaledTotalHeight = Math.round(totalHeight * devicePixelRatio);
  const scaledViewportHeight = Math.round(viewportHeight * devicePixelRatio);

  canvas.width = scaledWidth;
  canvas.height = scaledTotalHeight;

  for (let i = 0; i < captures.length; i++) {
    const img = await loadImage(captures[i]);
    const yPos = Math.round(scrollPositions[i] * devicePixelRatio);

    // For the last capture, we may need to clip to avoid overrun
    const remainingHeight = scaledTotalHeight - yPos;
    const drawHeight = Math.min(img.height, remainingHeight);
    const sourceY = img.height - drawHeight; // clip from top if partial

    if (i === captures.length - 1 && drawHeight < img.height) {
      // Last segment: align to bottom
      ctx.drawImage(img, 0, sourceY, img.width, drawHeight, 0, scaledTotalHeight - drawHeight, img.width, drawHeight);
    } else {
      ctx.drawImage(img, 0, yPos);
    }
  }

  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const quality = format === 'jpeg' ? 0.92 : undefined;
  return canvas.toDataURL(mimeType, quality);
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// ── Recording ──
async function startRecording(streamId, type) {
  try {
    const constraints = {
      audio: type === 'tab' ? { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } } : false,
      video: {
        mandatory: {
          chromeMediaSource: type === 'tab' ? 'tab' : 'desktop',
          chromeMediaSourceId: streamId
        }
      }
    };

    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    recordedChunks = [];

    // Try preferred codecs, fall back gracefully
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];

    let selectedMime = 'video/webm';
    for (const mt of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mt)) {
        selectedMime = mt;
        break;
      }
    }

    mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType: selectedMime,
      videoBitsPerSecond: 5_000_000
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.start(1000); // Collect data every second
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') {
    return { success: false, error: 'No active recording' };
  }

  return new Promise((resolve) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        // Clean up
        if (mediaStream) {
          mediaStream.getTracks().forEach(t => t.stop());
          mediaStream = null;
        }
        mediaRecorder = null;
        recordedChunks = [];

        resolve({ success: true, dataUrl: reader.result });
      };
      reader.readAsDataURL(blob);
    };

    mediaRecorder.stop();
  });
}
