document.addEventListener('DOMContentLoaded', () => {
    const overallRating = document.getElementById('overall-rating');
    const categoriesContainer = document.getElementById('category-ratings');
    const customCategoryInput = document.getElementById('custom-category');
    const form = document.getElementById('review-form');


    // Function to create rating stars
    function createRatingStars(container, onSelect) {
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.textContent = '★';
            star.dataset.value = i;
            star.addEventListener('mouseover', () => {
                Array.from(container.children).forEach(starElem => {
                    starElem.style.color = starElem.dataset.value <= i ? '#f4b942' : '#ddd';
                });
            });
            star.addEventListener('mouseout', () => {
                Array.from(container.children).forEach(starElem => {
                    starElem.style.color = starElem.classList.contains('selected') ? '#f4b942' : '#ddd';
                });
            });
            star.addEventListener('click', () => {
                Array.from(container.children).forEach(starElem => {
                    starElem.classList.toggle('selected', starElem.dataset.value <= i);
                });
                if (onSelect) onSelect(i);
            });
            container.appendChild(star);
        }
    }

    // Initialize overall rating stars
    createRatingStars(overallRating, (rating) => {
        overallRating.dataset.value = rating;
    });

    // Initialize default categories with rating stars
    defaultCategories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.classList.add('input-pair');
        categoryDiv.innerHTML = `
            <label>${category} Rating:</label>
            <div class="rating" data-category="${category}">
                <!-- Rating stars for default category -->
            </div>
        `;
        categoriesContainer.appendChild(categoryDiv);
        createRatingStars(categoryDiv.querySelector('.rating'), (rating) => {
            categoryDiv.querySelector('.rating').dataset.value = rating;
        });
    });

    // Function to add custom category
    function addCustomCategory() {
        const customCategoryName = customCategoryInput.value.trim();
        if (customCategoryName) {
            const categoryDiv = document.createElement('div');
            categoryDiv.classList.add('input-pair');
            categoryDiv.innerHTML = `
                <label>${customCategoryName} Rating:</label>
                <div class="rating" data-category="${customCategoryName}">
                    <!-- Rating stars for custom category -->
                </div>
            `;
            categoriesContainer.appendChild(categoryDiv);
            createRatingStars(categoryDiv.querySelector('.rating'), (rating) => {
                categoryDiv.querySelector('.rating').dataset.value = rating;
            });
            customCategoryInput.value = '';
        }
    }

    // Add event listener for custom category button
    document.querySelector('.add-category-btn').addEventListener('click', addCustomCategory);

     // Form submission
     form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);

        // Append user ID and hospital ID
        formData.append('user_id', userId);
        formData.append('hospital_id', hospitalId);

        // Append overall rating
        formData.append('overall_rating', overallRating.dataset.value || 3);

        // Collect category ratings
        const categoryRatings = {};
        document.querySelectorAll('#category-ratings .rating').forEach(ratingElem => {
            const category = ratingElem.dataset.category;
            const rating = ratingElem.dataset.value;
            if (rating) {
                categoryRatings[category] = rating;
            }
        });
        formData.append('ratings', JSON.stringify(categoryRatings));

        // Append review content
        // formData.append('review_content', document.getElementById('review-content').value);

        // Append files
        // const fileInputs = document.querySelectorAll('#file-upload');
        // fileInputs.forEach(fileInput => {
        //     for (const file of fileInput.files) {
        //         formData.append('attachments', file);
        //     }
        // });

        // Send form data
        try {
            const response = await fetch('/add_review', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            if (result.message) {
                alert('Review submitted successfully!');
                form.reset();
                document.querySelectorAll('.rating').forEach(ratingElem => {
                    ratingElem.innerHTML = '';
                    createRatingStars(ratingElem);
                });
            } else {
                alert('Failed to submit review. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('An error occurred. Please try again later.');
        }
    });
});