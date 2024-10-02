// Fetch and display events from the RSS XML file
fetch('dataset/events.rss')
    .then(response => response.text())
    .then(str => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(str, "text/xml");
        const items = xmlDoc.querySelectorAll('item');
        const events = [];

        // Process each event item in the XML
        items.forEach(item => {
            // Extract data
            const title = item.querySelector('title') ? item.querySelector('title').textContent : 'No Title';
            const enclosure = item.querySelector('enclosure');
            const imageUrl = enclosure ? enclosure.getAttribute('url') : 'assets/default_img.png';

            const startDateStr = item.querySelector('start') ? item.querySelector('start').textContent : null;
            const startDate = startDateStr ? new Date(startDateStr) : new Date();
            const options = { weekday: 'long', month: 'long', day: '2-digit', year: 'numeric' };
            const formattedStartDate = startDate.toLocaleDateString('en-US', options);

            const location = item.querySelector('location') ? item.querySelector('location').textContent : 'Location not present';

            const descriptionCData = item.querySelector('description').textContent;
            const descriptionParser = new DOMParser();
            const descriptionDoc = descriptionParser.parseFromString(descriptionCData, "text/html");
            const description = descriptionDoc.body.innerHTML;

            // Store current event data as an object
            const event = {
                title,
                imageUrl,
                startDate: formattedStartDate,
                location,
                description,
            };
            events.push(event);

            // Create and display event cards
            createEventCard(event);
        });

        // Display total number of events
        updateEventCount(events.length, events.length);

        // Add filtering functionality after the events are loaded
        addFilterFunctionality(events);
    })
    .catch(error => console.error('Error on fetching data:', error));

// Function to create an event card
function createEventCard(event) {
    const article = document.createElement('article');
    article.innerHTML = `
        <img src="${event.imageUrl}" alt="${event.title}">
        <h2>${event.title}</h2>
        <p>${event.startDate}</p>
        <p>${event.location}</p>
        <a href="#" class="learn-more">Learn more</a>
        <div class="description" style="display: none;">
        ${event.description}
        </div>
    `;

    // Add toggle functionality for "Learn more"
    const learnMore = article.querySelector('.learn-more');
    const descriptionData = article.querySelector('.description');

    learnMore.addEventListener('click', (e) => {
        e.preventDefault();
        if (descriptionData.style.display === 'none') {
            descriptionData.style.display = 'block';
            learnMore.textContent = 'Show less';
        } else {
            descriptionData.style.display = 'none';
            learnMore.textContent = 'Learn more';
        }
    });

    document.querySelector('main').appendChild(article);
}

// Function to update event count
function updateEventCount(count, total) {
    const eventCount = document.getElementById('event-count');
    eventCount.textContent = `Showing: ${count}/${total} events`;
}

// Function to add filter functionality
function addFilterFunctionality(events) {
    // Add event listener to the 'Apply Filters' button
    document.getElementById('apply-filters').addEventListener('click', () => {
        const titleValue = document.getElementById('filter-title').value;
        const dateValue = document.getElementById('filter-date').value;
        const descriptionValue = document.getElementById('filter-description').value;

        let filteredEvents = events;

        // Filter by title if a title value is provided
        if (titleValue) {
            filteredEvents = filterEvents(filteredEvents, titleValue, (event) => titleFilter(event, titleValue));
        }

        // Filter by date if a date value is provided
        if (dateValue) {
            filteredEvents = filterEvents(filteredEvents, dateValue, (event) => dateFilter(event, dateValue));
        }

        // Filter by description if a description value is provided
        if (descriptionValue) {
            filteredEvents = filterEvents(filteredEvents, descriptionValue, (event) => descriptionFilter(event, descriptionValue));
        }

        // Clear current events display
        document.querySelector('main').innerHTML = '';

        // Display filtered events
        filteredEvents.forEach(event => {
            createEventCard(event);
        });

        // Update event count
        updateEventCount(filteredEvents.length, events.length);
    });

    // Add event listener to 'Clear Filters' button
    document.getElementById('clear-filters').addEventListener('click', () => {
        // Clear filter input values
        document.getElementById('filter-title').value = '';
        document.getElementById('filter-date').value = '';
        document.getElementById('filter-description').value = '';

        // Reset events display
        document.querySelector('main').innerHTML = '';
        events.forEach(event => createEventCard(event));

        // Update event count
        updateEventCount(events.length, events.length);
    });
}

// Generic filter function
function filterEvents(events, filterValue, filterFunction) {
    if (!filterValue) return events; // If no filter value is provided, return all events
    return events.filter(filterFunction);
}

// Filter functions
function titleFilter(event, title) {
    return event.title.toLowerCase().includes(title.toLowerCase());
}

function dateFilter(event, date) {
    const eventDate = new Date(event.startDate);
    const filterDate = new Date(date);
    return eventDate.toDateString() === filterDate.toDateString();
}

function descriptionFilter(event, description) {
    return event.description.toLowerCase().includes(description.toLowerCase());
}
