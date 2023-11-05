// add our markup to the page
const root = document.getElementById('root')

const updateStore = async (store, newState = {}, callback = null) => {
    const newStore = store.mergeDeep(newState)
    await render(root, newStore)
    if (callback !== null) return callback(newStore)
}

const render = async (root, state) => {
    root.innerHTML = App(state)
}

// create content
const App = (state) => {
    const user = state.get('user');
    const rovers = state.get('rovers');
    const selectedRover = state.get('selectedRover');
    const selectedRoverImages = state.get('selectedRoverImages');
    const roversHtml = rovers && rovers.map((rover) => RoverCard(state, rover)).join('');
    const roverImagesHtml = selectedRoverImages && selectedRoverImages.get('photos') && selectedRoverImages.get('photos').map((photo) => ImageOfTheDay(photo)).join('')
    const isLoading = selectedRover && selectedRover.get('loading');
    return `
        <main class="container-fluid py-3">
            <div class="p-4 mb-4 bg-primary text-white rounded-3">
                ${Greeting(user.get('name'))}
                <p>Mars rover dashboard that consumes the NASA API</p>
            </div>

            <div class="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-3 mb-4">
                ${rovers ? roversHtml : Loading()}
            </div>
            ${selectedRover ?
            `<div class="bg-light border rounded-3 p-4">
                <div class="row row-cols-1 row-cols-md-3 row-cols-xl-4 g-4">
                    ${isLoading ? Loading() : roverImagesHtml}
                </div>
            </div>` : ''}
        </main>
    `
}

// listening for load event because page should load before any JS is called
window.addEventListener('load', () => {
    const store = Immutable.Map({
        user: Immutable.Map({ name: 'Nguyen Thanh Dat' }),
        selectedRover: false,
        selectedRoverImages: false
    })
    render(root, store);

    getListOfRovers((data) => {
        const rovers = Immutable.Map({
            rovers: Immutable.fromJS(data.rovers)
        })
        updateStore(store, rovers);
    })
})

// ------------------------------------------------------  COMPONENTS
// Pure function that renders conditional information
const Greeting = (name) => {
    if (name) {
        return `
            <h1>Welcome, ${name}!</h1>
        `
    }

    return `
        <h1>Hello!</h1>
    `
}

// Pure function that renders loading
const Loading = () => {
    return '<div class="px-3">Loading...</div>'
}

// Pure function that renders rover requested from the backend
const RoverCard = (state, rover) => {
    const stateParam = JSON.stringify(state).replace(/"/g, '\'');
    const roverParam = JSON.stringify(rover).replace(/"/g, '\'');
    const isActiveRover = state.get('selectedRover') && state.get('selectedRover').get('name') === rover.get('name');
    const isLoading = isActiveRover && state.get('selectedRover').get('loading');
    return `<div class="col">
                <div class="${isActiveRover ? 'bg-light' : ''} border p-3 rounded-3">
                    <h5 class="card-title">${rover.get('name')}</h5>
                    <p class="small">
                        This rover launched in ${rover.get('launch_date')}, land in Mars in ${rover.get('landing_date')} and is now ${rover.get('status')}
                    </p>
                    <button ${isLoading ? 'disabled' : ''} class="btn btn-primary" onclick="retImageOfTheDay(${stateParam}, ${roverParam})">
                        See today image
                    </button>
                </div>
            </div>`
}

// Pure function that renders images requested from the backend
const ImageOfTheDay = (photo) => {
    const url = photo.get('img_src')
    const alt = photo.get('camera').get('full_name')
    const fullCamName = photo.get('camera').get('full_name')
    const tDate = photo.get('earth_date')
    const roverName = photo.get('rover').get('name')
    const lDate = photo.get('rover').get('landing_date')
    const pLDate = photo.get('rover').get('launch_date')
    const title = `${roverName} - ${fullCamName}`
    const status = photo.get('rover').get('status')

    return `
    <div class="col">
        <div class="card rover-card h-100">
            <a class="card-img bg-light" href="${url}" target="_blank">
                <img class="card-img-top" src="${url}" alt="${alt}">
            </a>
            <div class="card-body">
                <h5 class="card-title">${title}</h5>
                <p class="card-text">This is a photo from ${fullCamName} for ${roverName}.</p>
            </div>
            <ul class="list-group list-group-flush small">
                <li class="list-group-item text-secondary">${roverName} has a${status === 'active' ? 'n' : ''} ${status} status.</li>
                <li class="list-group-item text-secondary">${roverName} landed on Mars in ${lDate}</li>
                <li class="list-group-item text-secondary">This project were launched in ${pLDate}</li>
                <li class="list-group-item text-secondary">This picture were took on ${tDate}</li>
            </ul>
        </div>
    </div>
    `
}

// Handle See today image button click
const retImageOfTheDay = (store, data) => {
    const selectedRover = Immutable.Map({
        selectedRoverImages: false,
        selectedRover: Immutable.fromJS({ ...data, loading: true })
    })

    updateStore(Immutable.fromJS(store), selectedRover, retRoverPhotos)
}

const retRoverPhotos = (state) => {
    const currentRover = state.get('selectedRover')
    getRoverPhotos(currentRover.get('name'), currentRover.get('max_date'), (data) => {
        const cSelectedRover = Immutable.Map({
            selectedRoverImages: Immutable.fromJS({ ...data }),
            selectedRover: Immutable.fromJS({ loading: false })
        })
        updateStore(state, cSelectedRover)
    })
}

// ------------------------------------------------------  API CALLS
// Call api to get list rovers
const getListOfRovers = (callback) => {
    fetch('http://localhost:3000/api/rovers')
        .then(res => res.json())
        .then(json => callback(json))
}

// Call api to get rover's photos
const getRoverPhotos = (roverName, maxDate, callback) => {
    fetch(`http://localhost:3000/api/rovers/${roverName}?max_date=${maxDate}`)
        .then(res => res.json())
        .then(json => callback(json))
}

