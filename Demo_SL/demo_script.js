// Mock data for SilentLedger Demo
// You can easily adjust the data here
const mockData = {
    private: [
        { id: 1, asset: "ETH", price: 2600.50, amount: 2.5, type: "Buy" },
        { id: 2, asset: "BTC", price: 43500.75, amount: 0.1, type: "Sell" },
        { id: 3, asset: "SOL", price: 145.20, amount: 15.0, type: "Buy" },
        { id: 4, asset: "ADA", price: 0.48, amount: 800.0, type: "Sell" },
        { id: 5, asset: "DOT", price: 7.25, amount: 120.5, type: "Buy" },
        { id: 6, asset: "MATIC", price: 0.62, amount: 650.0, type: "Sell" },
        { id: 7, asset: "LINK", price: 14.80, amount: 45.0, type: "Buy" }
    ],
    public: [
        { id: 1, asset: "ETH", price: 2600.50, amount: 2.5, type: "Buy" },
        { id: 2, asset: "BTC", price: 43500.75, amount: 0.1, type: "Sell" },
        { id: 3, asset: "SOL", price: 145.20, amount: 15.0, type: "Buy" },
        { id: 4, asset: "ADA", price: 0.48, amount: 800.0, type: "Sell" },
        { id: 5, asset: "DOT", price: 7.25, amount: 120.5, type: "Buy" }
    ],
    god: [
        { id: 1, asset: "ETH", price: 2600.50, amount: 2.5, type: "Buy", hidden: false },
        { id: 2, asset: "BTC", price: 43500.75, amount: 0.1, type: "Sell", hidden: false },
        { id: 3, asset: "SOL", price: 145.20, amount: 15.0, type: "Buy", hidden: true },
        { id: 4, asset: "ADA", price: 0.48, amount: 800.0, type: "Sell", hidden: true },
        { id: 5, asset: "DOT", price: 7.25, amount: 120.5, type: "Buy", hidden: true },
        { id: 6, asset: "MATIC", price: 0.62, amount: 650.0, type: "Sell", hidden: true },
        { id: 7, asset: "LINK", price: 14.80, amount: 45.0, type: "Buy", hidden: true }
    ]
};

// Slide data with sequences grouped by command
const slideSequences = [
    {
        command: "Initial Orderbook State",
        sequence: [
            {
                title: "Slide 1 - Initial State",
                privateOrderbook: "Private Orderbook: Initial data (1/3). Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
                publicOrderbook: "Public Orderbook: Initial view (1/3). Sed do eiusmod tempor incididunt ut labore.",
                privateOutput: "Private Output: Initial result (1/3). Ut enim ad minim veniam.",
                publicOutput: "Public Output: Initial output (1/3). Quis nostrud exercitation ullamco.",
                privateGod: "Private God View: Initial insight (1/3). Duis aute irure dolor in reprehenderit.",
                publicGod: "Public God View: Initial overview (1/3). Excepteur sint occaecat cupidatat non proident."
            },
            {
                title: "Slide 2 - Order Update",
                privateOrderbook: "Private Orderbook: Updated data (2/3). Aenean commodo ligula eget dolor.",
                publicOrderbook: "Public Orderbook: Updated view (2/3). Aenean massa.",
                privateOutput: "Private Output: Updated result (2/3). Cum sociis natoque penatibus.",
                publicOutput: "Public Output: Updated output (2/3). Magnis dis parturient montes.",
                privateGod: "Private God View: Updated insight (2/3). Nascetur ridiculus mus.",
                publicGod: "Public God View: Updated overview (2/3). Donec quam felis, ultricies nec."
            },
            {
                title: "Slide 3 - Final State",
                privateOrderbook: "Private Orderbook: Final data (3/3). Pellentesque eu, pretium quis.",
                publicOrderbook: "Public Orderbook: Final view (3/3). Sem.",
                privateOutput: "Private Output: Final result (3/3). Maecenas tempus, tellus eget condimentum.",
                publicOutput: "Public Output: Final output (3/3). Rhoncus, sem quam semper libero.",
                privateGod: "Private God View: Final insight (3/3). Sit amet augue eget arcu.",
                publicGod: "Public God View: Final overview (3/3). Dictum varius."
            }
        ]
    },
    {
        command: "Front-Running Attempt",
        sequence: [
            {
                title: "Slide 1 - Attempt Start",
                privateOrderbook: "Private Orderbook: Attempt detected (1/2). Lorem ipsum dolor sit amet.",
                publicOrderbook: "Public Orderbook: Attempt visible (1/2). Consectetur adipiscing elit.",
                privateOutput: "Private Output: Defense active (1/2). Sed do eiusmod tempor.",
                publicOutput: "Public Output: Vulnerability exposed (1/2). Incididunt ut labore.",
                privateGod: "Private God View: Defense strategy (1/2). Ut enim ad minim veniam.",
                publicGod: "Public God View: Attack path clear (1/2). Quis nostrud exercitation."
            },
            {
                title: "Slide 2 - Attempt Result",
                privateOrderbook: "Private Orderbook: Attempt blocked (2/2). Aenean commodo ligula eget.",
                publicOrderbook: "Public Orderbook: Attempt successful (2/2). Dolor.",
                privateOutput: "Private Output: Protection confirmed (2/2). Aenean massa.",
                publicOutput: "Public Output: Loss incurred (2/2). Cum sociis natoque.",
                privateGod: "Private God View: Privacy preserved (2/2). Penatibus et magnis.",
                publicGod: "Public God View: Transparency exploited (2/2). Dis parturient montes."
            }
        ]
    },
    {
        command: "Asset Verification",
        sequence: [
            {
                title: "Slide 1 - Verification Process",
                privateOrderbook: "Private Orderbook: Asset check initiated. Lorem ipsum dolor.",
                publicOrderbook: "Public Orderbook: Asset status pending. Sit amet, consectetur.",
                privateOutput: "Private Output: Validation in progress. Adipiscing elit.",
                publicOutput: "Public Output: Awaiting confirmation. Sed do eiusmod.",
                privateGod: "Private God View: Detailed audit. Tempor incididunt ut.",
                publicGod: "Public God View: Surface check only. Labore et dolore magna."
            }
        ]
    }
];

let currentCommand = null;
let currentSlideIndex = 0;
let autoInterval = null;
const defaultSpeed = 1000; // Default auto-scroll speed in milliseconds (1 second)

// Scrolling control variables
const scrollIntervals = {
    private: null,
    public: null,
    god: null,
    combined: null
};

const scrollSpeeds = {
    private: 5,
    public: 5,
    god: 5,
    combined: 5
};

let currentMode = 'demo';

// Initialize the demo
function initDemo() {
    updateSpeed();
    renderSlide();
    document.getElementById("speed-slider").addEventListener("input", updateSpeed);
}

// Render the current slide
function renderSlide() {
    if (!currentCommand || currentCommand === "") {
        // Show default landing screen with original line numbers
        document.getElementById("private-orderbook-data").innerHTML = "<pre>top-left\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10</pre>";
        document.getElementById("public-orderbook-data").innerHTML = "<pre>top-right\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10</pre>";
        document.getElementById("private-output-data").innerHTML = "<pre>bottom-left\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10</pre>";
        document.getElementById("public-output-data").innerHTML = "<pre>bottom-right\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10</pre>";
        document.getElementById("private-god-data-window").innerHTML = "<pre>top\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10</pre>";
        document.getElementById("public-god-data-window").innerHTML = "<pre>bottom\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10</pre>";
        return;
    }
    
    const commandData = slideSequences.find(item => item.command === currentCommand);
    if (!commandData || commandData.sequence.length === 0) return;
    
    if (currentSlideIndex >= commandData.sequence.length) {
        currentSlideIndex = 0; // Loop back to the first slide in the sequence
    }
    
    const slide = commandData.sequence[currentSlideIndex];
    
    // Update all windows with the current slide's content
    document.getElementById("private-orderbook").innerHTML = slide.privateOrderbook;
    document.getElementById("public-orderbook").innerHTML = slide.publicOrderbook;
    document.getElementById("private-output").innerHTML = slide.privateOutput;
    document.getElementById("public-output").innerHTML = slide.publicOutput;
    document.getElementById("private-god").innerHTML = slide.privateGod;
    document.getElementById("public-god").innerHTML = slide.publicGod;
}

// Move to the next slide
function nextSlide() {
    if (!currentCommand) return;
    const commandData = slideSequences.find(item => item.command === currentCommand);
    if (!commandData || commandData.sequence.length === 0) return;
    
    currentSlideIndex = (currentSlideIndex + 1) % commandData.sequence.length;
    renderSlide();
}

// Auto-scroll through slides
function autoScroll() {
    if (autoInterval) {
        clearInterval(autoInterval);
        autoInterval = null;
        document.getElementById("auto-btn").textContent = "Auto";
        return false;
    } else if (currentCommand) {
        const speed = document.getElementById("speed-slider").value;
        autoInterval = setInterval(nextSlide, speed);
        document.getElementById("auto-btn").textContent = "Stop Auto";
        return true;
    }
    return false;
}

// Update auto-scroll speed
function updateSpeed() {
    const slider = document.getElementById("speed-slider");
    const speed = slider.value;
    if (autoInterval) {
        clearInterval(autoInterval);
        autoInterval = setInterval(nextSlide, speed);
    }
}

// Start the demo with the selected command
function startScroll() {
    const input = document.getElementById("command-input");
    const commandText = input.value.trim();
    const commandData = slideSequences.find(item => item.command === commandText);
    
    if (commandData) {
        currentCommand = commandText;
        currentSlideIndex = 0;
        renderSlide();
    }
}

// Stop scrolling
function stopScroll() {
    if (autoInterval) {
        clearInterval(autoInterval);
        autoInterval = null;
        document.getElementById("auto-btn").textContent = "Auto";
    }
}

// Reset the demo
function resetDemo() {
    currentCommand = null;
    currentSlideIndex = 0;
    stopScroll();
    document.getElementById("command-input").value = "";
    renderSlide();
}

// Select a command from dropdown
function selectCommand(command) {
    document.getElementById("command-input").value = command;
    currentCommand = command;
    currentSlideIndex = 0;
    stopScroll();
    renderSlide();
    document.getElementById("command-dropdown").style.display = "none";
}

// Toggle dropdown visibility
function toggleDropdown() {
    const dropdown = document.getElementById("command-dropdown");
    if (dropdown.style.display === "block") {
        dropdown.style.display = "none";
    } else {
        dropdown.style.display = "block";
    }
}

// Close dropdown if clicking outside
function windowOnClick(event) {
    if (!event.target.matches(".dropbtn") && !event.target.matches("#command-input")) {
        document.getElementById("command-dropdown").style.display = "none";
    }
}

// Initialize on load
window.onload = initDemo;

// Render data for each window
function renderData(windowType) {
    let dataToRender = [];
    if (windowType === 'private') {
        dataToRender = mockData.private;
    } else if (windowType === 'public') {
        dataToRender = mockData.public;
    } else if (windowType === 'god') {
        dataToRender = mockData.god;
    }

    const privateGodContainer = document.getElementById('private-god-data');
    const publicGodContainer = document.getElementById('public-god-data');
    const container = windowType === 'god' ? document.getElementById('god-data') : document.getElementById(`${windowType}-data`);

    if (windowType === 'god') {
        privateGodContainer.innerHTML = '';
        publicGodContainer.innerHTML = '';
        renderOrderbook(mockData.private, 'private-god-data', 'Private');
        renderOrderbook(mockData.public, 'public-god-data', 'Public');
    } else {
        container.innerHTML = '';
        renderOrderbook(dataToRender, `${windowType}-data`, windowType.charAt(0).toUpperCase() + windowType.slice(1));
    }
}

function renderOrderbook(data, containerId, type) {
    const container = document.getElementById(containerId);
    const table = document.createElement('table');
    table.className = 'orderbook-table';

    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th colspan="4">${type} Orderbook</th>
        </tr>
        <tr>
            <th>Price</th>
            <th>Size</th>
            <th>Total</th>
            <th>Type</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    data.forEach(item => {
        const row = document.createElement('tr');
        row.className = item.type === 'Buy' ? 'buy-row' : 'sell-row';
        if (currentMode === 'demo' && item.hidden) {
            row.style.opacity = '0.5';
        } else if (currentMode === 'simulation' && item.hidden) {
            row.style.display = 'none';
        }
        row.innerHTML = `
            <td>${item.price.toFixed(2)}</td>
            <td>${item.amount.toFixed(2)}</td>
            <td>${(item.price * item.amount).toFixed(2)}</td>
            <td>${item.type}</td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
}

// Start scrolling for a specific window
function startScrolling(windowType) {
    if (scrollIntervals[windowType]) return;
    if (windowType === 'combined') {
        const privateContainer = document.getElementById(`private-data`);
        const publicContainer = document.getElementById(`public-data`);
        const privateGodContainer = document.getElementById(`private-god-data`);
        const publicGodContainer = document.getElementById(`public-god-data`);
        scrollIntervals['combined'] = setInterval(() => {
            privateContainer.scrollTop += scrollSpeeds['combined'];
            publicContainer.scrollTop += scrollSpeeds['combined'];
            privateGodContainer.scrollTop += scrollSpeeds['combined'];
            publicGodContainer.scrollTop += scrollSpeeds['combined'];
            if (privateContainer.scrollTop >= privateContainer.scrollHeight - privateContainer.clientHeight) {
                privateContainer.scrollTop = 0;
            }
            if (publicContainer.scrollTop >= publicContainer.scrollHeight - publicContainer.clientHeight) {
                publicContainer.scrollTop = 0;
            }
            if (privateGodContainer.scrollTop >= privateGodContainer.scrollHeight - privateGodContainer.clientHeight) {
                privateGodContainer.scrollTop = 0;
            }
            if (publicGodContainer.scrollTop >= publicGodContainer.scrollHeight - publicGodContainer.clientHeight) {
                publicGodContainer.scrollTop = 0;
            }
        }, 50);
    } else {
        const container = document.getElementById(`${windowType}-data`);
        scrollIntervals[windowType] = setInterval(() => {
            container.scrollTop += scrollSpeeds[windowType];
            if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
                container.scrollTop = 0;
            }
        }, 50);
    }
}

// Stop scrolling for a specific window
function stopScrolling(windowType) {
    if (scrollIntervals[windowType]) {
        clearInterval(scrollIntervals[windowType]);
        scrollIntervals[windowType] = null;
    }
}

// Update scrolling speed for a specific window
function updateScrollSpeed(windowType, speed) {
    scrollSpeeds[windowType] = parseInt(speed);
}

function changeMode(mode) {
    if (mode === 'demo') {
        resetDemo();
    } else if (mode === 'simulation') {
        // Placeholder for simulation mode if needed
    }
}
