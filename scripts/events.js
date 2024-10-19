"use strict";

let events = [];
let categories = new Set();
// Default to 25 events per page
let pagefilter = 25;
// Start on page 1
let currentPage = 1;

const getEvents = () => {
    return fetch('dataset/events.rss')
        .then(response => response.text())
        .then(str => {
            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(str, "text/xml");
            let items = xmlDoc.querySelectorAll('item');
            items.forEach(item => {
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

                let event = {
                    title,
                    imageUrl,
                    startDate: formattedStartDate,
                    location,
                    description,
                    category,
                };
                events.push(event);
            });

            populateCategories(categories);
            updateEventCount(events.length, events.length);
            renderEvents(events);
            renderPagination(events.length);
            addFilterFunctionality(events);
        })
        .catch(error => console.error('error on fetching data', error));
}

// Function to render the events for the current page
function renderEvents(eventsToRender) {
    // Clear the main container
    document.querySelector('main').innerHTML = '';

    let startIndex, endIndex;

    if (pagefilter === "all") {
        startIndex = 0;
        endIndex = eventsToRender.length;
    } else {
        startIndex = (currentPage - 1) * pagefilter;
        endIndex = Math.min(startIndex + pagefilter, eventsToRender.length);
    }

    for (let i = startIndex; i < endIndex; i++) {
        createEventCard(eventsToRender[i]);
    }

    updateEventCount(endIndex - startIndex, eventsToRender.length);
    renderPagination(eventsToRender.length);
}

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

        // Reset to page 1 when a filter is applied
        currentPage = 1;

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

        // Render the filtered events on page 1
        renderEvents(filteredEvents);
    });


    document.getElementById('clear-filters').addEventListener('click', () => {
        document.getElementById('filter-title').value = '';
        document.getElementById('filter-date').value = '';
        document.getElementById('filter-description').value = '';
        document.getElementById('filter-category').value = '';

        renderEvents(events);
    });
}

// Dynamic Pagination based on current page
function renderPagination(totalEvents) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    if (pagefilter === "all") return;

    const totalPages = Math.ceil(totalEvents / pagefilter);
    // Number of pages to show around the current page
    const maxPagesToShow = 3;

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderEvents(events);
        }
    });
    paginationContainer.appendChild(prevButton);

    if (currentPage > 2) {
        const firstPage = createPageLink(1);
        paginationContainer.appendChild(firstPage);
        if (currentPage > 3) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            paginationContainer.appendChild(dots);
        }
    }

    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
        const pageLink = createPageLink(i);
        paginationContainer.appendChild(pageLink);
    }

    if (currentPage < totalPages - 1) {
        if (currentPage < totalPages - 2) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            paginationContainer.appendChild(dots);
        }
        const lastPage = createPageLink(totalPages);
        paginationContainer.appendChild(lastPage);
    }

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderEvents(events);
        }
    });
    paginationContainer.appendChild(nextButton);
}

// Create a page link
function createPageLink(pageNumber) {
    const pageLink = document.createElement('a');
    pageLink.href = '#';
    pageLink.textContent = pageNumber;
    pageLink.classList.add('page-link');
    if (pageNumber === currentPage) {
        pageLink.classList.add('active');
    }
    pageLink.addEventListener('click', (e) => {
        e.preventDefault();
        currentPage = pageNumber;
        renderEvents(events);
    });
    return pageLink;
}

// Filter functions
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

document.getElementById('amount-filter').addEventListener('change', () => {
    const selectedValue = document.getElementById('amount-filter').value;

    // Reset to page 1 when the number of cards per page changes
    currentPage = 1;

    pagefilter = selectedValue === "all" ? "all" : parseInt(selectedValue);

    // Retrieve the currently applied filters
    const titleValue = document.getElementById('filter-title').value;
    const dateValue = document.getElementById('filter-date').value;
    const descriptionValue = document.getElementById('filter-description').value;
    const categoryValue = document.getElementById('filter-category').value;

    let filteredEvents = events;

    // Reapply the current filters to the events
    if (titleValue) {
        filteredEvents = filterEvents(filteredEvents, titleValue, (event) => titleFilter(event, titleValue));
    }

    if (dateValue) {
        filteredEvents = filterEvents(filteredEvents, dateValue, (event) => dateFilter(event, dateValue));
    }

    if (descriptionValue) {
        filteredEvents = filterEvents(filteredEvents, descriptionValue, (event) => descriptionFilter(event, descriptionValue));
    }

    if (categoryValue) {
        filteredEvents = filterEvents(filteredEvents, categoryValue, (event) => categoryFilter(event, categoryValue));
    }

    // Render the filtered events with the new page size
    renderEvents(filteredEvents);
});


getEvents();
