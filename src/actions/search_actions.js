import {
  getSearchedArtistsCall,
  getSearchedTracksCall,
  getSearchedPlaylistsCall,
  trackLookup
} from './spotifyApi_actions'

// Actions
export const SET_SEARCHED_ARTISTS = 'set_searched_artists'
export const SET_SEARCHED_TRACKS = 'set_searched_tracks'
export const SET_SEARCHED_PLAYLISTS = 'set_searched_playlists'
export const TRACK_LOOKUP = 'TRACK_LOOKUP'

export const getSearchedArtists = word => async dispatch => {
  let artists = await getSearchedArtistsCall(word)

  if (artists) {
    dispatch({ type: SET_SEARCHED_ARTISTS, payload: artists })
  }
}

export const getSearchedTracks = word => async dispatch => {
  let tracks = await getSearchedTracksCall(word)

  if (tracks) {
    dispatch({ type: SET_SEARCHED_TRACKS, payload: tracks })
  }
}

export const getSearchedPlaylists = word => async dispatch => {
  let playlists = await getSearchedPlaylistsCall(word)
  console.log('getSearchedPlaylists',playlists)
  if (playlists) {
    dispatch({ type: SET_SEARCHED_PLAYLISTS, payload: playlists })
  }
}

export const gettrackLookup = word => async dispatch => {
  console.log("gettrackLookup HIT");
  let playlists = await trackLookup(word)
  console.log('trackLookUp',playlists)
  if (playlists) {
    dispatch({ type: TRACK_LOOKUP, payload: playlists })
  }
}
