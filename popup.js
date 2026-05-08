// ── State ──
let imageFormat = 'png';

// ── UI Helpers ──
const statusEl = document.getElementById('status');
const statusText = document.getElementById('statusText');

function setStatus(msg, type = '') {
  statusEl.className = 'status ' + type;
  statusText.textContent = msg;
}

function sendMsg(action, data = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action, ...data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// ── Format Selector ──
document.querySelectorAll('.format-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    imageFormat = btn.dataset.format;
  });
});

// ── Visible Screenshot ──
document.getElementById('captureVisible').addEventListener('click', async () => {
  try {
    setStatus('Capturing visible area…', 'working');
    const res = await sendMsg('captureVisible', { format: imageFormat });
    if (res?.success) {
      setStatus('Screenshot saved!', 'success');
    } else {
      setStatus(res?.error || 'Capture failed', 'error');
    }
  } catch (err) {
    setStatus(err.message, 'error');
  }
});

// ── Full Page Screenshot ──
document.getElementById('captureFullPage').addEventListener('click', async () => {
  try {
    setStatus('Capturing full page… don\'t scroll!', 'working');
    const res = await sendMsg('captureFullPage', { format: imageFormat });
    if (res?.success) {
      setStatus('Full page screenshot saved!', 'success');
    } else {
      setStatus(res?.error || 'Capture failed', 'error');
    }
  } catch (err) {
    setStatus(err.message, 'error');
  }
});

// ── Tab Recording ──
document.getElementById('recordTab').addEventListener('click', async () => {
  try {
    const res = await sendMsg('getRecordingState');
    if (res?.isRecording && res?.type === 'tab') {
      setStatus('Stopping recording…', 'working');
      const stopRes = await sendMsg('stopRecording');
      if (stopRes?.success) {
        updateRecordUI('tab', false);
        setStatus('Recording saved!', 'success');
      }
    } else {
      setStatus('Starting tab recording…', 'working');
      const startRes = await sendMsg('startTabRecording');
      if (startRes?.success) {
        updateRecordUI('tab', true);
        setStatus('Recording tab…', 'working');
      } else {
        setStatus(startRes?.error || 'Failed to start', 'error');
      }
    }
  } catch (err) {
    setStatus(err.message, 'error');
  }
});

// ── Screen Recording ──
document.getElementById('recordScreen').addEventListener('click', async () => {
  try {
    const res = await sendMsg('getRecordingState');
    if (res?.isRecording && res?.type === 'screen') {
      setStatus('Stopping recording…', 'working');
      const stopRes = await sendMsg('stopRecording');
      if (stopRes?.success) {
        updateRecordUI('screen', false);
        setStatus('Recording saved!', 'success');
      }
    } else {
      setStatus('Choose what to record…', 'working');
      const startRes = await sendMsg('startScreenRecording');
      if (startRes?.success) {
        updateRecordUI('screen', true);
        setStatus('Recording screen…', 'working');
      } else {
        setStatus(startRes?.error || 'Failed to start', 'error');
      }
    }
  } catch (err) {
    setStatus(err.message, 'error');
  }
});

function updateRecordUI(type, isRecording) {
  const btnId = type === 'tab' ? 'recordTab' : 'recordScreen';
  const labelId = type === 'tab' ? 'recordTabLabel' : 'recordScreenLabel';
  const descId = type === 'tab' ? 'recordTabDesc' : 'recordScreenDesc';
  const btn = document.getElementById(btnId);
  const label = document.getElementById(labelId);
  const desc = document.getElementById(descId);

  if (isRecording) {
    btn.classList.add('recording');
    label.textContent = type === 'tab' ? 'Stop Tab Recording' : 'Stop Screen Recording';
    desc.textContent = 'Click to stop and save';
    // Add pulsing dot
    let dot = btn.querySelector('.rec-dot');
    if (!dot) {
      dot = document.createElement('div');
      dot.className = 'rec-dot';
      btn.appendChild(dot);
    }
  } else {
    btn.classList.remove('recording');
    label.textContent = type === 'tab' ? 'Record Tab' : 'Record Screen';
    desc.textContent = type === 'tab' ? 'Capture current tab as video' : 'Pick a window or screen';
    const dot = btn.querySelector('.rec-dot');
    if (dot) dot.remove();
  }
}

// ── On popup open, sync recording state ──
(async () => {
  try {
    const res = await sendMsg('getRecordingState');
    if (res?.isRecording) {
      updateRecordUI(res.type, true);
      setStatus(`Recording ${res.type}…`, 'working');
    }
  } catch (e) {
    // Background may not be ready
  }
})();
