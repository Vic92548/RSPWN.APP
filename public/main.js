function makeApiRequest(path, requireAuth = true) {
    return new Promise((resolve, reject) => {
        // Retrieve the JWT from local storage
        let jwt = localStorage.getItem('jwt');
        if (!jwt && requireAuth) {
            reject("No JWT found in local storage.");
            return;
        }

        jwt = "";

        // Prepare the request headers
        const headers = new Headers({
            "Authorization": `Bearer ${jwt}`,
            "Content-Type": "application/json"
        });

        // Make the fetch request to the API
        fetch(path, {
            method: 'GET', // or 'POST', 'PUT', etc., depending on the requirement
            headers: headers
        })
        .then(response => {
            if (!response.ok) {
                console.log(response);

                if(response.status === 401){
                    reject("Unauthorized");
                }else{
                    throw new Error('Network response was not ok: ' + response.statusText);
                }

                
            }
            return response.json();  // Assuming the server responds with JSON
        })
        .then(data => {
            resolve(data);  // Resolve the promise with the response data
        })
        .catch(error => {
            reject(error);  // Reject the promise if there's an error
        });
    });
}

function isUserLoggedIn(){
    if(window.user){
        return true;
    }else{
        return false;
    }
}

function loadUserData(){
    makeApiRequest("/me").then(data => {
        window.user = data;
        document.getElementById("sign_in").style.display = "none";

        hideLoading();
    }).catch( error => {
        document.getElementById("sign_in").style.display = "block";
        document.getElementById("add_post").style.display = "none";
        hideLoading();
    })
}

loadUserData();

function hideLoading(){
    document.getElementsByTagName('H1')[0].className = "title";

    document.getElementsByTagName("ARTICLE")[0].style.transform = "translateY(0vh)";
}

function opeNewPostModel() {
    document.getElementById("add-post").className = "";
}

function timeAgo(dateParam) {
    if (!dateParam) {
        return null;
    }

    const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam);
    const today = new Date();
    const seconds = Math.round((today - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const months = Math.round(days / 30.4); // average number of days in month
    const years = Math.round(days / 365);

    if (seconds < 60) {
        return `${seconds} seconds ago`;
    } else if (minutes < 60) {
        return `${minutes} minutes ago`;
    } else if (hours < 24) {
        return `${hours} hours ago`;
    } else if (days < 30) {
        return `${days} days ago`;
    } else if (months < 12) {
        return `${months} months ago`;
    } else {
        return `${years} years ago`;
    }
}


function displayPost(postId = "6a64874b-677f-4026-ace8-0bd2bbffd274"){
    makeApiRequest("/posts/"+postId).then(data => {
        console.log("Post DATA:");
        console.log(data);

        document.getElementById("post_title").textContent = data.title;
        document.getElementById("post_username").textContent = "@" + data.username;
        document.getElementById("post_time").textContent = timeAgo(data.timestamp);

        if(data.content.split("/posts/")[0] === "https://vapr.b-cdn.net"){
            document.getElementById("post_image").src = data.content;
            document.getElementById("post_image").style.display = "block";
            document.getElementById("post_content").style.display = "none";
        }else{
            document.getElementById("post_content").textContent = data.content;
            document.getElementById("post_content").style.display = "block";
            document.getElementById("post_image").style.display = "none";
        }
    }).catch(error => {
        console.log(error);
    })
}

displayPost();

document.getElementById('postForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const file = document.getElementById('file').files[0];

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    
    if (file) {
        const fileExtension = file.name.split('.').pop(); // Extract the file extension
        const fileName = `${new Date().getTime()}.${fileExtension}`; // Create a unique file name using a timestamp
        const fileContentType = file.type || 'application/octet-stream'; // Default to a binary type if unknown
    
        // Create a new Blob from the file with the specified content type
        const blob = new Blob([file], { type: fileContentType });
    
        // Append the blob to formData with the custom filename
        formData.append("file", blob, fileName);
    }
    

    const jwt = localStorage.getItem('jwt');

    // Prepare the request headers
    const headers = new Headers({
        "Authorization": `Bearer ${jwt}`
    });

    try {
        const response = await fetch('/posts', {
            method: 'POST',
            body: formData,
            headers: headers
        });

        const result = await response.json();
        if (response.ok) {
            alert('Post created successfully! Post ID: ' + result.id);
            // Optionally clear the form or handle according to your needs
        } else {
            alert('Failed to create post. Status: ' + response.status);
        }
    } catch (error) {
        console.error('Failed to submit post:', error);
        alert('Error submitting post.');
    }
});