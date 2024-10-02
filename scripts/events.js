fetch('dataset/events.rss')
    .then(response => response.text())
    .then(str => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(str, "text/xml");
        const items = xmlDoc.querySelectorAll('item');
        const events = [];

    items.forEach(item => {
        // Extract data

        const title = item.querySelector('title') ? item.querySelector('title').textContent : 'No Title';
        const enclosure = item.querySelector('enclosure');
        const imageUrl = enclosure ? enclosure.getAttribute('url') : 'assets/default_img.png';

        const startDateStr = item.querySelector('start') ? item.querySelector('start').textContent : null;
        const startDate = startDateStr ? new Date(startDateStr) : new Date();
        const options = { weekday: 'long', month: 'long', day: '2-digit', year: 'numeric' };
        const formattedStartDate = startDate.toLocaleDateString('en-US', options);

        const location = item.querySelector('location').textContent || 'Location not present';

        const descriptionCData = item.querySelector('description').textContent;
        const descriptionParser = new DOMParser();
        const descriptionDoc = descriptionParser.parseFromString(descriptionCData, "text/html");
        const description = descriptionDoc.body.innerHTML;

        // Store current event data
        const event = {
            title,
            imageUrl,
            startDate: formattedStartDate,
            location,
            description,
        };
        events.push(event);

        // Create the card for current event
        const article = document.createElement('article');
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

        // Add current card to the main container
        document.querySelector('main').appendChild(article);
        });
    })
    .catch(error => console.error('error on fetching data', error));
