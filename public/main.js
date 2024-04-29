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
    }).catch( error => {
        document.getElementById("sign_in").style.display = "block";
    })
}

loadUserData();

function showLoading(){
    document.getElementById('loading').style.display = "block";
}

function hideLoading(){
    document.getElementById('loading').className = "title";
    document.getElementsByTagName("MAIN")[0].style.opacity = "1";
}