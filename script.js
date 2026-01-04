// DOM Elements
const leftEditor = document.getElementById('left-editor');
const rightEditor = document.getElementById('right-editor');
const leftLineNumbers = document.getElementById('left-line-numbers');
const rightLineNumbers = document.getElementById('right-line-numbers');
const leftTitle = document.getElementById('left-title');
const rightTitle = document.getElementById('right-title');
const leftStatus = document.getElementById('left-status');
const rightStatus = document.getElementById('right-status');
const convertBtn = document.getElementById('convert-btn');
const convertBtnText = document.getElementById('convert-btn-text');
const modeBtns = document.querySelectorAll('.mode-btn');
const appContainer = document.querySelector('.app-container');

// Current mode
let currentMode = 'json-toon';

// History for undo functionality
let leftHistory = [];
let rightHistory = [];
const MAX_HISTORY = 50;

// Initialize
function init() {
    // Check URL hash for mode
    const hash = window.location.hash.substring(1);
    if (hash === 'toon-json' || hash === 'json-toon') {
        currentMode = hash;
    }
    
    updateMode();
    setupEventListeners();
    updateCharCounts();
}

// Setup Event Listeners
function setupEventListeners() {
    // Mode switcher
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentMode = btn.dataset.mode;
            window.location.hash = currentMode;
            updateMode();
        });
    });
    
    // Hash change
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1);
        if (hash === 'toon-json' || hash === 'json-toon') {
            currentMode = hash;
            updateMode();
        }
    });
    
    // Convert button
    convertBtn.addEventListener('click', handleConvert);
    
    // Action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            if (action) handleAction(action);
        });
    });
    
    // Dropdown items
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const caseType = e.currentTarget.dataset.case;
            if (caseType) changeCasing(caseType);
        });
    });
    
    // Dropdown toggle
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = toggle.nextElementSibling;
            menu.classList.toggle('show');
        });
    });
    
    // Close dropdowns
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    });
    
    // Character count and line numbers
    leftEditor.addEventListener('input', () => {
        updateCharCount('left');
        updateLineNumbers('left');
        saveToHistory('left');
    });
    rightEditor.addEventListener('input', () => {
        updateCharCount('right');
        updateLineNumbers('right');
        saveToHistory('right');
    });
    
    // Sync scroll for line numbers
    leftEditor.addEventListener('scroll', () => syncScroll('left'));
    rightEditor.addEventListener('scroll', () => syncScroll('right'));
    
    // Initialize line numbers
    updateLineNumbers('left');
    updateLineNumbers('right');
}

// Update Mode
function updateMode() {
    // Update mode buttons
    modeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === currentMode);
    });
    
    // Update container class
    appContainer.className = 'app-container mode-' + currentMode;
    
    // Update favicon based on mode
    const favicon = document.getElementById('favicon');
    if (currentMode === 'json-toon') {
        favicon.href = 'favicon-json-toon.svg';
        document.title = 'JSON → Toon Converter';
    } else {
        favicon.href = 'favicon-toon-json.svg';
        document.title = 'Toon → JSON Converter';
    }
    
    if (currentMode === 'json-toon') {
        leftTitle.textContent = 'JSON Input';
        rightTitle.textContent = 'Toon Output';
        convertBtnText.textContent = 'Convert JSON to Toon';
        leftEditor.placeholder = 'Enter your JSON here...';
        rightEditor.placeholder = 'Toon output will appear here...';
    } else {
        leftTitle.textContent = 'Toon Input';
        rightTitle.textContent = 'JSON Output';
        convertBtnText.textContent = 'Convert Toon to JSON';
        leftEditor.placeholder = 'Enter your Toon here...';
        rightEditor.placeholder = 'JSON output will appear here...';
    }
    
    // Clear editors when switching
    leftEditor.value = '';
    rightEditor.value = '';
    updateStatus('left', 'Ready', false);
    updateStatus('right', 'Ready', false);
    updateCharCounts();
    updateLineNumbers('left');
    updateLineNumbers('right');
}

// Load Sample Data
function loadSample() {
    if (currentMode === 'json-toon') {
        // Sample JSON
        leftEditor.value = `{
  "person": {
    "name": "John Doe",
    "age": 30,
    "email": "john.doe@example.com",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "zipCode": "10001"
    },
    "hobbies": ["reading", "coding", "traveling"],
    "isActive": true
  }
}`;
    } else {
        // Sample Toon
        leftEditor.value = `📦 person
  📝 name: John Doe
  🔢 age: 30
  📧 email: john.doe@example.com
  📍 address
    🏠 street: 123 Main St
    🌆 city: New York
    📮 zipCode: 10001
  🎯 hobbies
    • reading
    • coding
    • traveling
  ✅ isActive: true`;
    }
    
    updateStatus('left', '✓ Sample loaded', true);
    updateCharCount('left');
    updateLineNumbers('left');
    saveToHistory('left');
    setTimeout(() => updateStatus('left', 'Ready', false), 2000);
}

// Handle Actions
function handleAction(action) {
    switch(action) {
        case 'validate-left':
            validateEditor('left');
            break;
        case 'validate-right':
            validateEditor('right');
            break;
        case 'load-sample':
            loadSample();
            break;
        case 'beautify-left':
            beautifyEditor('left');
            break;
        case 'beautify-right':
            beautifyEditor('right');
            break;
        case 'sort-keys':
            sortJsonKeys();
            break;
        case 'clear-left':
            leftEditor.value = '';
            updateStatus('left', 'Cleared', false);
            updateCharCount('left');
            updateLineNumbers('left');
            saveToHistory('left');
            break;
        case 'clear-right':
            rightEditor.value = '';
            updateStatus('right', 'Cleared', false);
            updateCharCount('right');
            updateLineNumbers('right');
            saveToHistory('right');
            break;
        case 'copy-left':
            copyToClipboard(leftEditor.value, 'left');
            break;
        case 'copy-right':
            copyToClipboard(rightEditor.value, 'right');
            break;
        case 'paste-left':
            pasteFromClipboard('left');
            break;
        case 'paste-right':
            pasteFromClipboard('right');
            break;
        case 'download-left':
            downloadContent('left');
            break;
        case 'download-right':
            downloadContent('right');
            break;
        case 'undo-left':
            undoEdit('left');
            break;
        case 'undo-right':
            undoEdit('right');
            break;
    }
}

// Validate Editor
function validateEditor(side) {
    const editor = side === 'left' ? leftEditor : rightEditor;
    const content = editor.value.trim();
    
    if (!content) {
        updateStatus(side, 'No content to validate', false);
        return;
    }
    
    try {
        if (currentMode === 'json-toon') {
            if (side === 'left') {
                JSON.parse(content);
                updateStatus(side, '✓ Valid JSON', true);
            } else {
                validateToon(content);
                updateStatus(side, '✓ Valid Toon', true);
            }
        } else {
            if (side === 'left') {
                validateToon(content);
                updateStatus(side, '✓ Valid Toon', true);
            } else {
                JSON.parse(content);
                updateStatus(side, '✓ Valid JSON', true);
            }
        }
    } catch (error) {
        updateStatus(side, '✗ ' + error.message, false, true);
    }
}

// Beautify Editor
function beautifyEditor(side) {
    const editor = side === 'left' ? leftEditor : rightEditor;
    const content = editor.value.trim();
    
    if (!content) {
        updateStatus(side, 'No content to beautify', false);
        return;
    }
    
    try {
        if (currentMode === 'json-toon') {
            if (side === 'left') {
                const obj = JSON.parse(content);
                editor.value = JSON.stringify(obj, null, 2);
                updateStatus(side, 'Beautified', true);
            } else {
                editor.value = formatToon(content);
                updateStatus(side, 'Beautified', true);
            }
        } else {
            if (side === 'left') {
                editor.value = formatToon(content);
                updateStatus(side, 'Beautified', true);
            } else {
                const obj = JSON.parse(content);
                editor.value = JSON.stringify(obj, null, 2);
                updateStatus(side, 'Beautified', true);
            }
        }
        updateCharCount(side);
        updateLineNumbers(side);
    } catch (error) {
        updateStatus(side, '✗ ' + error.message, false, true);
    }
}

// Sort JSON Keys
function sortJsonKeys() {
    if (currentMode !== 'json-toon') return;
    
    const content = leftEditor.value.trim();
    if (!content) {
        updateStatus('left', 'No JSON to sort', false);
        return;
    }
    
    try {
        const obj = JSON.parse(content);
        const sorted = sortObjectKeys(obj);
        leftEditor.value = JSON.stringify(sorted, null, 2);
        updateStatus('left', 'Keys sorted', true);
        updateCharCount('left');
        updateLineNumbers('left');
    } catch (error) {
        updateStatus('left', '✗ ' + error.message, false, true);
    }
}

// Sort Object Keys Recursively
function sortObjectKeys(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(sortObjectKeys);
    
    return Object.keys(obj).sort().reduce((result, key) => {
        result[key] = sortObjectKeys(obj[key]);
        return result;
    }, {});
}

// Change Casing
function changeCasing(caseType) {
    if (currentMode !== 'json-toon') return;
    
    const content = leftEditor.value.trim();
    if (!content) {
        updateStatus('left', 'No JSON to convert', false);
        return;
    }
    
    try {
        const obj = JSON.parse(content);
        const converted = convertObjectCasing(obj, caseType);
        leftEditor.value = JSON.stringify(converted, null, 2);
        updateStatus('left', `Converted to ${caseType}`, true);
        updateCharCount('left');
        updateLineNumbers('left');
    } catch (error) {
        updateStatus('left', '✗ ' + error.message, false, true);
    }
}

// Convert Object Casing
function convertObjectCasing(obj, caseType) {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(item => convertObjectCasing(item, caseType));
    
    return Object.keys(obj).reduce((result, key) => {
        const newKey = convertCase(key, caseType);
        result[newKey] = convertObjectCasing(obj[key], caseType);
        return result;
    }, {});
}

// Convert Case
function convertCase(str, caseType) {
    // Split by various delimiters
    const words = str.split(/[\s_-]|(?=[A-Z])/).filter(Boolean).map(w => w.toLowerCase());
    
    switch(caseType) {
        case 'camel':
            return words.map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('');
        case 'pascal':
            return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
        case 'snake':
            return words.join('_');
        case 'kebab':
            return words.join('-');
        default:
            return str;
    }
}

// Handle Convert
function handleConvert() {
    const input = leftEditor.value.trim();
    
    if (!input) {
        updateStatus('left', 'No input to convert', false);
        return;
    }
    
    try {
        if (currentMode === 'json-toon') {
            const obj = JSON.parse(input);
            const toon = jsonToToon(obj);
            rightEditor.value = toon;
            updateStatus('left', '✓ Valid JSON', true);
            updateStatus('right', '✓ Converted to Toon', true);
        } else {
            const obj = toonToJSON(input);
            rightEditor.value = JSON.stringify(obj, null, 2);
            updateStatus('left', '✓ Valid Toon', true);
            updateStatus('right', '✓ Converted to JSON', true);
        }
        updateCharCount('right');
        updateLineNumbers('right');
    } catch (error) {
        updateStatus('left', '✗ ' + error.message, false, true);
    }
}

// JSON to Toon Converter
function jsonToToon(obj, rootName = 'root') {
    const iconMap = {
        string: '📝',
        number: '🔢',
        boolean: '✅',
        object: '📦',
        array: '🎯',
        null: '⚫',
        email: '📧',
        address: '📍',
        street: '🏠',
        city: '🌆',
        zipCode: '📮',
        phone: '📞',
        url: '🔗',
        date: '📅',
        time: '⏰',
        user: '👤',
        person: '👤',
        name: '📝',
        age: '🔢',
        id: '🔑',
        price: '💰',
        count: '🔢'
    };
    
    function getIcon(key, value) {
        const lowerKey = key.toLowerCase();
        if (iconMap[lowerKey]) return iconMap[lowerKey];
        
        if (value === null) return iconMap.null;
        if (typeof value === 'boolean') return iconMap.boolean;
        if (typeof value === 'number') return iconMap.number;
        if (Array.isArray(value)) return iconMap.array;
        if (typeof value === 'object') return iconMap.object;
        return iconMap.string;
    }
    
    function convert(obj, key, level = 0) {
        const indent = '  '.repeat(level);
        
        if (obj === null) {
            return `${indent}${getIcon(key, obj)} ${key}: null\n`;
        }
        
        if (typeof obj === 'boolean') {
            return `${indent}${getIcon(key, obj)} ${key}: ${obj}\n`;
        }
        
        if (typeof obj === 'number') {
            return `${indent}${getIcon(key, obj)} ${key}: ${obj}\n`;
        }
        
        if (typeof obj === 'string') {
            return `${indent}${getIcon(key, obj)} ${key}: ${obj}\n`;
        }
        
        if (Array.isArray(obj)) {
            let result = `${indent}${getIcon(key, obj)} ${key}\n`;
            obj.forEach((item, index) => {
                if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                    result += convert(item, `item${index}`, level + 1);
                } else if (Array.isArray(item)) {
                    result += convert(item, `subarray${index}`, level + 1);
                } else {
                    result += `${indent}  • ${item}\n`;
                }
            });
            return result;
        }
        
        if (typeof obj === 'object') {
            let result = `${indent}${getIcon(key, obj)} ${key}\n`;
            for (let k in obj) {
                result += convert(obj[k], k, level + 1);
            }
            return result;
        }
        
        return `${indent}${key}: ${obj}\n`;
    }
    
    return convert(obj, rootName, 0).trim();
}

// Toon to JSON Converter
function toonToJSON(toonString) {
    const lines = toonString.split('\n').map(line => line.trimEnd());
    
    function getIndentLevel(line) {
        const match = line.match(/^(\s*)/);
        return match ? Math.floor(match[1].length / 2) : 0;
    }
    
    function removeBullet(line) {
        return line.replace(/^\s*•\s*/, '');
    }
    
    function parseValue(value) {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value === 'null') return null;
        if (/^-?\d+$/.test(value)) return parseInt(value, 10);
        if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
        return value;
    }
    
    function parseLine(line) {
        // Remove emoji icons
        line = line.replace(/^(\s*)[📝🔢✅📦🎯⚫📧📍🏠🌆📮📞🔗📅⏰👤🔑💰]\s*/, '$1');
        
        const trimmed = line.trim();
        
        // Check if it's a bullet point
        if (trimmed.startsWith('•')) {
            return {
                type: 'bullet',
                value: removeBullet(trimmed).trim()
            };
        }
        
        // Check if it has a colon (key-value pair)
        if (trimmed.includes(':')) {
            const colonIndex = trimmed.indexOf(':');
            const key = trimmed.substring(0, colonIndex).trim();
            const value = trimmed.substring(colonIndex + 1).trim();
            
            if (value) {
                return {
                    type: 'keyvalue',
                    key: key,
                    value: parseValue(value)
                };
            } else {
                return {
                    type: 'object',
                    key: key
                };
            }
        }
        
        // Just a key (object or array marker)
        return {
            type: 'object',
            key: trimmed
        };
    }
    
    function buildObject(lines, startIndex = 0, parentIndent = -1) {
        if (startIndex >= lines.length) {
            return { obj: {}, nextIndex: startIndex };
        }
        
        const currentLine = lines[startIndex];
        const currentIndent = getIndentLevel(currentLine);
        
        if (currentIndent <= parentIndent) {
            return { obj: {}, nextIndex: startIndex };
        }
        
        const parsed = parseLine(currentLine);
        
        if (parsed.type === 'keyvalue') {
            // Simple key-value, no children expected at this level
            const obj = {};
            obj[parsed.key] = parsed.value;
            return { obj: obj, nextIndex: startIndex + 1 };
        }
        
        if (parsed.type === 'object') {
            // Check what comes next
            let i = startIndex + 1;
            const children = [];
            let childObj = {};
            
            while (i < lines.length) {
                const nextLine = lines[i];
                const nextIndent = getIndentLevel(nextLine);
                
                if (nextIndent <= currentIndent) {
                    break;
                }
                
                if (nextIndent === currentIndent + 1) {
                    const nextParsed = parseLine(nextLine);
                    
                    if (nextParsed.type === 'bullet') {
                        // It's an array
                        children.push(parseValue(nextParsed.value));
                        i++;
                    } else if (nextParsed.type === 'keyvalue') {
                        // Object property
                        childObj[nextParsed.key] = nextParsed.value;
                        i++;
                    } else {
                        // Nested object
                        const result = buildObject(lines, i, currentIndent);
                        Object.assign(childObj, result.obj);
                        i = result.nextIndex;
                    }
                } else {
                    i++;
                }
            }
            
            const obj = {};
            if (children.length > 0) {
                obj[parsed.key] = children;
            } else if (Object.keys(childObj).length > 0) {
                obj[parsed.key] = childObj;
            } else {
                obj[parsed.key] = {};
            }
            
            return { obj: obj, nextIndex: i };
        }
        
        return { obj: {}, nextIndex: startIndex + 1 };
    }
    
    // Build the entire structure
    let result = {};
    let index = 0;
    
    while (index < lines.length) {
        const buildResult = buildObject(lines, index, -1);
        Object.assign(result, buildResult.obj);
        index = buildResult.nextIndex;
        
        if (index === buildResult.nextIndex) {
            index++;
        }
    }
    
    // If there's only one root key, unwrap it
    const keys = Object.keys(result);
    if (keys.length === 1) {
        return result;
    }
    
    return result;
}

// Validate Toon
function validateToon(toonString) {
    if (!toonString || !toonString.trim()) {
        throw new Error('Empty Toon string');
    }
    return true;
}

// Format Toon
function formatToon(toon) {
    // Simple formatting - just ensure consistent spacing
    const lines = toon.split('\n');
    let formatted = '';
    
    for (let line of lines) {
        const trimmed = line.trimEnd();
        if (trimmed) {
            formatted += trimmed + '\n';
        }
    }
    
    return formatted.trim();
}

// Copy to Clipboard
async function copyToClipboard(text, side) {
    if (!text) {
        updateStatus(side, 'No content to copy', false);
        return;
    }
    
    try {
        await navigator.clipboard.writeText(text);
        updateStatus(side, '✓ Copied to clipboard', true);
        setTimeout(() => updateStatus(side, 'Ready', false), 2000);
    } catch (error) {
        updateStatus(side, '✗ Failed to copy', false, true);
    }
}

// Paste from Clipboard
async function pasteFromClipboard(side) {
    try {
        const text = await navigator.clipboard.readText();
        const editor = side === 'left' ? leftEditor : rightEditor;
        editor.value = text;
        updateStatus(side, '✓ Pasted from clipboard', true);
        updateCharCount(side);
        updateLineNumbers(side);
        saveToHistory(side);
        setTimeout(() => updateStatus(side, 'Ready', false), 2000);
    } catch (error) {
        updateStatus(side, '✗ Failed to paste', false, true);
    }
}

// Download Content
function downloadContent(side) {
    const editor = side === 'left' ? leftEditor : rightEditor;
    const content = editor.value;
    
    if (!content) {
        updateStatus(side, 'No content to download', false);
        return;
    }
    
    // Determine file extension and name based on mode and side
    let filename, mimeType;
    
    if (currentMode === 'json-toon') {
        if (side === 'left') {
            filename = 'data.json';
            mimeType = 'application/json';
        } else {
            filename = 'data.toon';
            mimeType = 'text/plain';
        }
    } else {
        if (side === 'left') {
            filename = 'data.toon';
            mimeType = 'text/plain';
        } else {
            filename = 'data.json';
            mimeType = 'application/json';
        }
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    updateStatus(side, `✓ Downloaded ${filename}`, true);
    setTimeout(() => updateStatus(side, 'Ready', false), 2000);
}

// Save to History
function saveToHistory(side) {
    const editor = side === 'left' ? leftEditor : rightEditor;
    const history = side === 'left' ? leftHistory : rightHistory;
    const content = editor.value;
    
    // Don't save if it's the same as the last entry
    if (history.length > 0 && history[history.length - 1] === content) {
        return;
    }
    
    history.push(content);
    
    // Limit history size
    if (history.length > MAX_HISTORY) {
        history.shift();
    }
    
    // Update the reference
    if (side === 'left') {
        leftHistory = history;
    } else {
        rightHistory = history;
    }
}

// Undo Edit
function undoEdit(side) {
    const editor = side === 'left' ? leftEditor : rightEditor;
    const history = side === 'left' ? leftHistory : rightHistory;
    
    if (history.length <= 1) {
        updateStatus(side, 'Nothing to undo', false);
        return;
    }
    
    // Remove current state
    history.pop();
    
    // Get previous state
    const previousContent = history[history.length - 1];
    editor.value = previousContent;
    
    updateStatus(side, '✓ Undo successful', true);
    updateCharCount(side);
    updateLineNumbers(side);
    setTimeout(() => updateStatus(side, 'Ready', false), 2000);
}

// Update Status
function updateStatus(side, message, isSuccess = false, isError = false) {
    const statusBar = side === 'left' ? leftStatus : rightStatus;
    const statusText = statusBar.querySelector('.status-text');
    statusText.textContent = message;
    statusText.classList.remove('success', 'error');
    if (isSuccess) statusText.classList.add('success');
    if (isError) statusText.classList.add('error');
}

// Update Line Numbers
function updateLineNumbers(side) {
    const editor = side === 'left' ? leftEditor : rightEditor;
    const lineNumbersEl = side === 'left' ? leftLineNumbers : rightLineNumbers;
    
    const content = editor.value;
    const lines = content.split('\n');
    const lineCount = lines.length;
    
    // Generate line numbers
    let lineNumbersHTML = '';
    for (let i = 1; i <= lineCount; i++) {
        lineNumbersHTML += `<span class="line-number">${i}</span>`;
    }
    
    lineNumbersEl.innerHTML = lineNumbersHTML;
}

// Sync Scroll
function syncScroll(side) {
    const editor = side === 'left' ? leftEditor : rightEditor;
    const lineNumbersEl = side === 'left' ? leftLineNumbers : rightLineNumbers;
    
    lineNumbersEl.scrollTop = editor.scrollTop;
}

// Update Character Count
function updateCharCount(side) {
    const editor = side === 'left' ? leftEditor : rightEditor;
    const statusBar = side === 'left' ? leftStatus : rightStatus;
    const charCount = statusBar.querySelector('.char-count');
    charCount.textContent = `${editor.value.length} characters`;
}

function updateCharCounts() {
    updateCharCount('left');
    updateCharCount('right');
}

// Initialize on load
init();
