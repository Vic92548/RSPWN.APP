function makeApiRequest(path) {
    return new Promise((resolve, reject) => {
        // Retrieve the JWT from local storage
        const jwt = localStorage.getItem('jwt');
        if (!jwt) {
            reject("No JWT found in local storage.");
            return;
        }

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

function displayPost(postId = "6a64874b-677f-4026-ace8-0bd2bbffd274"){
    makeApiRequest("/posts/"+postId).then(data => {
        console.log("Post DATA:");
        console.log(data);

        document.getElementById("post_title").textContent = data.title;
        document.getElementById("post_username").textContent = "@" + data.username;

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