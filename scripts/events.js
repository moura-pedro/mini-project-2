"use strict";

let events = [];
let categories = new Set();

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

            let category = item.querySelector('category') ? item.querySelector('category').textContent : 'Uncategorized';
            categories.add(category);

            // Store current event data
            let event = {
                title,
                imageUrl,
                startDate: formattedStartDate,
                location,
                description,
                category,
            };
            events.push(event);

            createEventCard(event);

        });

        populateCategories(categories);
        updateEventCount(events.length, events.length);
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
        if (descriptionData.style.display === 'none' || !descriptionData.style.display) {
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

// Function to populate categories into the select element
function populateCategories(categories) {
    const categorySelect = document.getElementById('filter-category');
    // Clear any existing options
    categorySelect.innerHTML = '';

    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'All';
    categorySelect.appendChild(allOption);

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

// Function to add filter functionality
function addFilterFunctionality(events) {
    document.getElementById('apply-filters').addEventListener('click', () => {
        const titleValue = document.getElementById('filter-title').value;
        const dateValue = document.getElementById('filter-date').value;
        const descriptionValue = document.getElementById('filter-description').value;
        const categoryValue = document.getElementById('filter-category').value;

        let filteredEvents = events;

        // Filter by title
        if (titleValue) {
            filteredEvents = filterEvents(filteredEvents, titleValue, (event) => titleFilter(event, titleValue));
        }

        // Filter by date 
        if (dateValue) {
            filteredEvents = filterEvents(filteredEvents, dateValue, (event) => dateFilter(event, dateValue));
        }

        // Filter by description
        if (descriptionValue) {
            filteredEvents = filterEvents(filteredEvents, descriptionValue, (event) => descriptionFilter(event, descriptionValue));
        }

        // Filter by category
        if (categoryValue) {
            filteredEvents = filterEvents(filteredEvents, categoryValue, (event) => categoryFilter(event, categoryValue));
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
        document.getElementById('filter-category').value = '';

        // Reset events display
        document.querySelector('main').innerHTML = '';
        events.forEach(event => createEventCard(event));

        // Update event count
        updateEventCount(events.length, events.length);
    });
}

// -------- Filter functions -------- //
function filterEvents(events, filterValue, filterFunction) {
    if (!filterValue) return events;
    return events.filter(filterFunction);
}

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

function categoryFilter(event, category) {
    return event.category === category;
}

getEvents();
