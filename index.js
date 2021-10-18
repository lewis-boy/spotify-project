
require('dotenv').config();
const { application } = require('express');
const express = require('express');
const app = express();
const axios = require('axios');
const port = 8888;
const path = require('path');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const FRONTEND_URI = process.env.FRONTEND_URI;
const PORT = process.env.PORT || 8888;

//"postinstall": "cd client && npm install"

// Priority serve any static files.
app.use(express.static(path.resolve(__dirname, './app/client/build')));


app.get('/', (req, res) =>{
    const data = {
        name: 'Heo',
        isAwesome: true
    };

    res.json(data);
});

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
 const generateRandomString = length => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };
  
  
  const stateKey = 'spotify_auth_state';


//template strings use back ticks 
app.get('/login', (req, res) => {
    const state = generateRandomString(16);
    res.cookie(stateKey,state);
    
    const scope = [
      'user-read-private',
      'user-read-email',
      'user-top-read'
    ].join(' ');



    const queryParams = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        state: state,
        scope: scope
    });
    res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

//broken
app.get('/callback', (req, res) => {
    //first get parameter from the uri
    //if parameter is not present, then set it to null
    const code = req.query.code || null;

    axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        data: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
        }),
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
        }
    }).then(response => {
        if(response.status === 200){
            const { access_token, refresh_token, expires_in } = response.data;
            const queryParams = new URLSearchParams({
              access_token: access_token,
              refresh_token: refresh_token,
              expires_in: expires_in
            });
            //redirect to react app
            
            res.redirect(`${FRONTEND_URI}?${queryParams}`);
            //pass along tokens in query

    
        } else{
            res.redirect(`/?${new URLSearchParams({error: 'invalid_token'})}`);
            
        }
    }).catch(error => {
        res.send(error);
    });

});


app.get('/refresh_token', (req, res) => {
    const { refresh_token } = req.query;

  axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    data: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    }),
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
  })
    .then(response => {
      res.send(response.data);
    })
    .catch(error => {
      res.send(error);
    });
});

// All remaining requests return the React app, so it can handle routing.
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, './client/build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Express app listening at http://localhost:${PORT}`);
});