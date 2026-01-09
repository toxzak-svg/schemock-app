import { RouteConfig } from '../types';
import { SchemaParser } from '../parsers/schema';

export function getPlaygroundHTML(routes: Record<string, RouteConfig>): string {
  const routesList = Object.values(routes).map((route, index) => {
    const method = route.method.toUpperCase();
    const path = route.path;
    const id = `route-${index}`;
    const schemaStr = route.schema ? JSON.stringify(route.schema, null, 2) : 'No specific schema defined';
    
    // Generate example response
    let exampleResponse = 'No example available';
    if (route.schema) {
      try {
        const hint = path.split('/').filter(p => p && p !== 'api').pop()?.replace(':id', '') || 'data';
        const parsed = SchemaParser.parse(route.schema, route.schema, new Set(), false, hint);
        exampleResponse = JSON.stringify(parsed, null, 2);
      } catch (e) {
        exampleResponse = 'Error generating example';
      }
    }
    
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(method);
    const bodySection = hasBody ? `
      <div class="request-body-section">
        <h4>Request Body</h4>
        <textarea id="${id}-request-body" class="request-body-input" placeholder='{"key": "value"}'>{}</textarea>
      </div>
    ` : '';
    
    return `
      <div class="route-card" id="${id}">
        <div class="route-header" onclick="toggleRoute('${id}')">
          <span class="method method-${method.toLowerCase()}">${method}</span>
          <code class="path">${path}</code>
          <span class="expand-icon">▼</span>
        </div>
        <div class="route-details" style="display: none;">
          <div class="tabs">
            <div class="tab active" onclick="showTab(event, '${id}', 'actions')">Try it out</div>
            <div class="tab" onclick="showTab(event, '${id}', 'schema')">Schema</div>
            <div class="tab" onclick="showTab(event, '${id}', 'example')">Example Response</div>
          </div>
          
          <div id="${id}-actions" class="tab-content active">
            ${bodySection}
            <div class="actions">
              <button class="btn btn-primary" onclick="tryItOut('${path}', '${method.toLowerCase()}', '${id}')">Send Request</button>
            </div>
            <div class="response-section" style="display: none;">
              <div class="response-header">
                <h4>Response</h4>
                <button class="btn-copy" onclick="copyToClipboard(this, '${id}-response')">Copy</button>
              </div>
              <div class="status-info">Status: <span class="status-code"></span></div>
              <pre id="${id}-response" class="response-body"></pre>
            </div>
          </div>

          <div id="${id}-schema" class="tab-content">
            <h4>Response Schema</h4>
            <pre class="schema-body">${schemaStr}</pre>
          </div>

          <div id="${id}-example" class="tab-content">
            <h4>Example Response</h4>
            <pre class="schema-body">${exampleResponse}</pre>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Schemock Playground</title>
      <style>
        :root {
          --primary-color: #2980b9;
          --success-color: #49cc90;
          --get-color: #61affe;
          --post-color: #49cc90;
          --put-color: #fca130;
          --delete-color: #f93e3e;
          --patch-color: #50e3c2;
          --bg-color: #f4f7f6;
          --card-bg: #ffffff;
          --text-color: #2c3e50;
          --border-color: #ddd;
        }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
          line-height: 1.6; 
          color: var(--text-color); 
          max-width: 1000px; 
          margin: 0 auto; 
          padding: 40px 20px;
          background-color: var(--bg-color);
        }
        h1 { 
          border-bottom: 2px solid var(--border-color); 
          padding-bottom: 15px; 
          color: var(--text-color);
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          font-size: 32px;
        }
        .subtitle {
          color: #7f8c8d;
          font-size: 16px;
          margin-top: -5px;
          margin-bottom: 25px;
        }
        .route-card { 
          background: var(--card-bg); 
          border: 1px solid var(--border-color); 
          border-radius: 8px; 
          margin-bottom: 15px; 
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transition: transform 0.2s;
        }
        .route-header {
          padding: 15px;
          display: flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
        }
        .route-header:hover {
          background-color: #f9f9f9;
        }
        .method { 
          padding: 4px 10px; 
          border-radius: 4px; 
          font-weight: bold; 
          font-size: 14px; 
          margin-right: 15px; 
          min-width: 70px; 
          text-align: center; 
          color: white; 
        }
        .method-get { background: var(--get-color); }
        .method-post { background: var(--post-color); }
        .method-put { background: var(--put-color); }
        .method-delete { background: var(--delete-color); }
        .method-patch { background: var(--patch-color); }
        
        .path { 
          font-size: 16px; 
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          flex-grow: 1;
        }
        .expand-icon {
          font-size: 12px;
          color: #999;
          transition: transform 0.3s;
        }
        .route-card.open .expand-icon {
          transform: rotate(180deg);
        }
        .route-details {
          padding: 20px;
          border-top: 1px solid var(--border-color);
          background-color: #fafafa;
        }
        .tabs {
          display: flex;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 20px;
        }
        .tab {
          padding: 8px 16px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          font-weight: bold;
          font-size: 14px;
          color: #7f8c8d;
        }
        .tab.active {
          border-bottom-color: var(--primary-color);
          color: var(--primary-color);
        }
        .tab-content {
          display: none;
        }
        .tab-content.active {
          display: block;
        }
        .btn {
          padding: 8px 16px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-weight: bold;
          font-size: 14px;
        }
        .btn-primary {
          background-color: var(--primary-color);
          color: white;
        }
        .btn-primary:hover {
          background-color: #2471a3;
        }
        .btn-copy {
          background: #ecf0f1;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          padding: 2px 8px;
          font-size: 12px;
          cursor: pointer;
        }
        .btn-copy:hover {
          background: #bdc3c7;
        }
        .request-body-section {
          margin-bottom: 15px;
        }
        .request-body-input {
          width: 100%;
          height: 100px;
          font-family: monospace;
          padding: 10px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          box-sizing: border-box;
        }
        .response-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
        }
        .response-section {
          margin-top: 20px;
          border-top: 1px solid var(--border-color);
          padding-top: 15px;
        }
        pre {
          background-color: #282c34;
          color: #abb2bf;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 14px;
          margin-top: 10px;
        }
        .status-info {
          font-size: 14px;
          margin-bottom: 5px;
        }
        .status-success { color: var(--success-color); font-weight: bold; }
        .status-error { color: var(--delete-color); font-weight: bold; }
        
        .footer { 
          margin-top: 50px; 
          font-size: 14px; 
          color: #7f8c8d; 
          text-align: center; 
          padding: 30px 20px 20px; 
          border-top: 1px solid var(--border-color); 
        }
        .footer a { color: var(--primary-color); text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
        .made-with { 
          font-size: 15px; 
          margin-bottom: 12px; 
        }
        
        .header-actions {
          display: flex;
          gap: 15px;
          margin: 25px 0;
          justify-content: center;
          flex-wrap: wrap;
        }
        .btn-share {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 24px;
          font-size: 15px;
          transition: all 0.3s ease;
        }
        .btn-share:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .btn-gallery {
          background: #10b981;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          transition: all 0.3s ease;
        }
        .btn-gallery:hover {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
      </style>
    </head>
    <body>
      <h1>🚀 Schemock Playground</h1>
      <p class="subtitle">Explore and test your generated mock APIs</p>
      
      <div class="header-actions">
        <button class="btn btn-share" onclick="shareSchema()">
          🔗 Share Schema
        </button>
        <a href="/api/gallery" class="btn btn-gallery" target="_blank">
          📚 Browse Gallery
        </a>
      </div>
      
      <div class="routes">
        ${routesList}
      </div>

      <div class="footer">
        <div class="made-with">Made with <a href="https://github.com/toxzak-svg/schemock-app" target="_blank" style="color: var(--primary-color);">❤️ Schemock</a></div>
        <div style="margin-top: 10px;">
          <a href="https://github.com/toxzak-svg/schemock-app" target="_blank">Documentation</a> &bull;
          <a href="/health">Health Status</a> &bull;
          <a href="/api/share" target="_blank">Share API</a>
        </div>
      </div>

      <script>
        function toggleRoute(id) {
          const card = document.getElementById(id);
          const details = card.querySelector('.route-details');
          const isOpen = card.classList.contains('open');
          
          if (isOpen) {
            details.style.display = 'none';
            card.classList.remove('open');
          } else {
            details.style.display = 'block';
            card.classList.add('open');
          }
        }

        function showTab(event, cardId, tabName) {
          event.stopPropagation();
          const card = document.getElementById(cardId);
          
          // Update tab buttons
          const tabs = card.querySelectorAll('.tab');
          tabs.forEach(tab => tab.classList.remove('active'));
          event.target.classList.add('active');
          
          // Update tab content
          const contents = card.querySelectorAll('.tab-content');
          contents.forEach(content => content.classList.remove('active'));
          card.querySelector('#' + cardId + '-' + tabName).classList.add('active');
        }

        async function tryItOut(path, method, cardId) {
          const card = document.getElementById(cardId);
          const responseSection = card.querySelector('.response-section');
          const statusCodeSpan = card.querySelector('.status-code');
          const responseBody = card.querySelector('.response-body');
          
          // Simple parameter handling: replace :id with a random one if needed
          let url = path;
          if (url.includes('/:')) {
             url = url.replace(/\/:[^/]+/, '/123'); // Default to 123 for now
          }

          const options = { method: method.toUpperCase() };
          
          if (['POST', 'PUT', 'PATCH'].includes(options.method)) {
            const bodyInput = card.querySelector('.request-body-input');
            if (bodyInput) {
              options.headers = { 'Content-Type': 'application/json' };
              options.body = bodyInput.value;
            }
          }

          try {
            responseSection.style.display = 'block';
            responseBody.textContent = 'Loading...';
            
            const startTime = performance.now();
            const response = await fetch(url, options);
            const endTime = performance.now();
            const duration = (endTime - startTime).toFixed(0);
            
            const data = await response.json();
            
            statusCodeSpan.textContent = \`\${response.status} \${response.statusText} (\${duration}ms)\`;
            statusCodeSpan.className = 'status-code ' + (response.ok ? 'status-success' : 'status-error');
            
            responseBody.textContent = JSON.stringify(data, null, 2);
          } catch (error) {
            statusCodeSpan.textContent = 'Error';
            statusCodeSpan.className = 'status-code status-error';
            responseBody.textContent = error.message;
          }
        }

        function copyToClipboard(btn, elementId) {
          const text = document.getElementById(elementId).textContent;
          navigator.clipboard.writeText(text).then(() => {
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = originalText, 2000);
          });
        }

        async function shareSchema() {
          try {
            const response = await fetch('/api/share');
            const data = await response.json();
            const shareUrl = window.location.origin + '/api/share';
            const shareText = 'Check out my mock API built with Schemock! ' + shareUrl;
              
            if (navigator.share) {
              await navigator.share({
                title: 'My Mock API',
                text: shareText,
                url: shareUrl
              });
            } else {
              // Fallback: copy to clipboard
              await navigator.clipboard.writeText(shareUrl);
              alert('Share URL copied to clipboard!\\n\\n' + shareUrl);
            }
          } catch (err) {
            alert('Error sharing schema: ' + err);
          }
        }
      </script>
    </body>
    </html>
  `;
}
