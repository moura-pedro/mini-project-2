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

        // Create the card for current event
        let article = document.createElement('article');
        article.innerHTML = `
            <img src="${imageUrl}" alt="${title}">
            <h2>${title}</h2>
            <p>${formattedStartDate}</p>
            <p>${location}</p>
            <a href="#" class="learn-more">Learn more</a>
            <div class="description" style="display: none;">
            ${description}
            </div>
        `;

        // Add Learn more toggle for current event
        let learnMore = article.querySelector('.learn-more');
        let descriptionData = article.querySelector('.description');

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

        // Add current card to the main container
        document.querySelector('main').appendChild(article);
        });
    })
    .catch(error => console.error('error on fetching data', error));
}

getEvents()
