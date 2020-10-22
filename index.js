'use strict';

const app = require('./server.js')();
const { get } = require('https');
var request = require('request');

// 1. List dataset
app.get('/datasets', function(req, res) {   
    const datasets = [
        {
            id: 'Playlist 34',
            name: {en: 'Playlist 34 Profile'},
            description: {en: 'Real-time air quality data for select cities'},
            columns: [
                    {id: 'song_name', name: {en: 'Song Name'}, type: 'hierarchy'},
                    {id: 'song_id', name: {en: 'Song ID'}, type: 'hierarchy'},
                    {id: 'artist_name', name: {en: 'Main Artist Name'}, type: 'hierarchy'},
                    {id: 'release_date', name: {en: 'Release Date'}, type: 'datetime'},
                    {id: 'danceability', name: {en: 'Danceability'}, type: 'numeric'},
                    {id: 'energy', name: {en: 'Energy'}, type: 'numeric'},
                    {id: 'acousticness', name: {en: 'Acousticness'}, type: 'numeric'},
                    {id: 'tempo', name: {en: 'Tempo'}, type: 'numeric'}
                ]
        }];
    return res.status(200).json(datasets);
});

function get_audio_features(track_id){
    request.get({
        headers : {'Authorization': `Bearer ${process.env.OAUTH_TOKEN}`},
        uri: `https://api.spotify.com/v1/audio-features/${track_id}`,
        gzip: true,
        json: true
    }, function(error, features) {
    if (error)
        return res.status(500).end('Internal Server Error');
    return [features.body.danceability, features.body.energy ,features.body.acousticness , features.body.tempo]
    });
}

app.post('/query', async function(req, res) {
    if (req.headers['x-secret'] !== process.env.CUMULIO_SECRET)
      return res.status(403).end('Given plugin secret does not match Cumul.io plugin secret.');

    request.get({
        headers : {'Authorization': `Bearer ${process.env.OAUTH_TOKEN}`},
        uri: `https://api.spotify.com/v1/playlists/${process.env.PLAYLIST_ID}/tracks`,
        gzip: true,
        json: true
    }, function(error, tracks) {
    if (error)
        return res.status(500).end('Internal Server Error');
    var track_infos = tracks.body.items.map(function(track) {
        var features = get_audio_features(track.track.id);
        return [track.track.name,  track.track.id, track.track.album.artists[0].name, track.track.album.release_date].concat(features);
    });
    console.log(track_infos);
    //return res.status(200).json(track_infos);
    });
    
  });