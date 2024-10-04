"use strict";

let events = [];

const getEvents = () => {
    return fetch('dataset/events.rss')
    .then(response => response.text())
    .then(str => {
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(str, "text/xml");
        let items = xmlDoc.querySelectorAll('item');

    items.forEach(item => {
        // Extract data
        let title = item.querySelector('title') ? item.querySelector('title').textContent : 'No Title';
        let enclosure = item.querySelector('enclosure');
        let imageUrl = enclosure ? enclosure.getAttribute('url') : 'assets/default_img.png';

        let startDateStr = item.querySelector('start') ? item.querySelector('start').textContent : null;
        let startDate = startDateStr ? new Date(startDateStr) : new Date();
        let options = { weekday: 'long', month: 'long', day: '2-digit', year: 'numeric' };
        let formattedStartDate = startDate.toLocaleDateString('en-US', options);

        let location = item.querySelector('location').textContent || 'Location not present';

        let descriptionCData = item.querySelector('description').textContent;
        let descriptionParser = new DOMParser();
        let descriptionDoc = descriptionParser.parseFromString(descriptionCData, "text/html");
        let description = descriptionDoc.body.innerHTML;

        // Store current event data
        let event = {
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
    .catch(error => console.error('error on fetching data', error));
}


// ------ Helper Functions ------ //

// Function to create an event card
function createEventCard(event) {
    const article = document.createElement('article');
    article.innerHTML = `
        <img src="${event.imageUrl}" alt="${event.title}">
        <h2>${event.title}</h2>
        <p class="event-date">${event.startDate}</p>
        <p>${event.location}</p>
        <a href="#" class="learn-more">Learn more</a>
        <div class="description">${event.description}</div>
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

getEvents()
