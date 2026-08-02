const form = document.getElementById('shorten-form');
const urlInput = document.getElementById('url-input');
const submitButton = document.getElementById('submit-button');
const submitButtonLabel = submitButton.querySelector('.button-label');
const resultBox = document.getElementById('result');
const resultLink = document.getElementById('result-link');
const copyButton = document.getElementById('copy-button');
const errorBox = document.getElementById('error');

function showResult(shortUrl) {
  resultLink.href = shortUrl;
  resultLink.textContent = shortUrl;
  resultBox.hidden = false;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function resetMessages() {
  resultBox.hidden = true;
  errorBox.hidden = true;
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButtonLabel.textContent = isLoading ? 'Shortening…' : 'Shorten';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  resetMessages();
  setLoading(true);

  try {
    const response = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: urlInput.value }),
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.error?.message || 'Something went wrong.');
      return;
    }

    showResult(data.shortUrl);
  } catch {
    showError('Could not reach the server. Please try again.');
  } finally {
    setLoading(false);
  }
});

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(resultLink.href);
    copyButton.textContent = 'Copied!';
    setTimeout(() => {
      copyButton.textContent = 'Copy';
    }, 1500);
  } catch {
    showError('Could not copy to clipboard.');
  }
});
