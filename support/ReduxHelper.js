import { Map } from 'immutable'

const REPLACE_STATE = '__tests/state/replace'

export default class ReduxHelper {
  constructor(store, rootReducer) {
    this._actions = []
    this.store = store
    this.rootReducer = rootReducer

    store.replaceReducer(this.reducer.bind(this))
  }

  get actions() {
    return this._actions
  }

  reset() {
    this._actions = []
    return this
  }

  mergeState(state) {
    const newState = this.store.getState().mergeDeep(state)
    this.replaceState(newState)
  }

  replaceState(state) {
    this.store.dispatch({
      type: REPLACE_STATE,
      state,
    })
  }

  reducer(state = Map(), action) {
    switch (action.type) {
      case REPLACE_STATE:
        return action.state
      case '@@INIT':
      case '@@redux/INIT':
        return this.rootReducer(state, action)
      default:
        this._actions.push(action)
        return this.rootReducer(state, action)
    }
  }
}
