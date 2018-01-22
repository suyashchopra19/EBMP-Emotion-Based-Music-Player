import $ from 'jquery'

export function trackLookup(genre, emotion) {
  if (access_token) {
    $.ajax({
      url: "https://api.spotify.com/v1/search",
      data: {
        q: "genre:" + genre + " year:2017",
        type: "track",
        market: "US",
        limit: "50"
      },
      headers: {
        Authorization: "Bearer " + access_token
      },
      success: function(response) {
        if (genre) {
          if (response.tracks.items.length != 0) {
            var randomIndex = Math.round(
              Math.random() * (response.tracks.items.length - 1)
            );
            var track = response.tracks.items[randomIndex];
            $("#songs").html(
              "<span> Based on your emotion of " +
                emotion.toUpperCase() +
                ", we recommend: <br/><h3>" +
                track.name +
                " by " +
                track.artists[0].name +
                "</h3></span><br/>"
            );
            displaySong(track.uri);
          }
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        alert(
          "Unable to authorize through Spotify Web API (Error " +
            jqXHR.status +
            ")"
        );
      }
    });
  }
}
