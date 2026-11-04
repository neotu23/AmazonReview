document.getElementById('downloadBtn').addEventListener('click', () => {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = "Extracting...";
  
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs.length === 0) {
      statusDiv.textContent = "No active tab found.";
      return;
    }
    
    const tabId = tabs[0].id;
    
    chrome.tabs.sendMessage(tabId, {action: "extract_reviews"}, (response) => {
      if (chrome.runtime.lastError) {
        statusDiv.textContent = "Error: " + chrome.runtime.lastError.message;
        return;
      }
      
      if (response && response.markdown) {
        downloadMarkdown(response.markdown, response.title || "amazon_reviews");
        const count = typeof response.count === "number" ? response.count : "";
        statusDiv.textContent = count === "" ? "Done!" : `Done! ${count} reviews.`;
      } else if (response && response.error) {
        statusDiv.textContent = "Error: " + response.error;
      } else {
        statusDiv.textContent = "No reviews found or extraction failed.";
      }
    });
  });
});

function downloadMarkdown(content, filename) {
  const blob = new Blob([content], {type: "text/markdown"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename + ".md";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
