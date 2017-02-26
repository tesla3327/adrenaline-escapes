var state = {};

/**
 * Stub out some data
 */
function getBookings() {
	return {
		'March 3, 2017': {
			date: 'March 3, 2017',
			times: [
				{ date: 'March 3, 2017', time: '5:00 PM', open: true },
				{ date: 'March 3, 2017', time: '6:30 PM', open: true },
				{ date: 'March 3, 2017', time: '8:00 PM', open: true },
				{ date: 'March 3, 2017', time: '9:30 PM', open: true },
			],
		},
		'March 4, 2017': {
			date: 'March 4, 2017',
			times: [
				{ date: 'March 4, 2017', time: '2:00 PM', open: true },
				{ date: 'March 4, 2017', time: '3:30 PM', open: true },
				{ date: 'March 4, 2017', time: '5:00 PM', open: true },
				{ date: 'March 4, 2017', time: '6:30 PM', open: true },
				{ date: 'March 4, 2017', time: '8:00 PM', open: true },
				{ date: 'March 4, 2017', time: '9:30 PM', open: true },
			],
		},
		'March 10, 2017': {
			date: 'March 10, 2017',
			times: [
				{ date: 'March 10, 2017', time: '5:00 PM', open: true },
				{ date: 'March 10, 2017', time: '6:30 PM', open: true },
				{ date: 'March 10, 2017', time: '8:00 PM', open: true },
				{ date: 'March 10, 2017', time: '9:30 PM', open: true },
			],
		},
		'March 11, 2017': {
			date: 'March 11, 2017',
			times: [
				{ date: 'March 11, 2017', time: '2:00 PM', open: true },
				{ date: 'March 11, 2017', time: '3:30 PM', open: true },
				{ date: 'March 11, 2017', time: '5:00 PM', open: true },
				{ date: 'March 11, 2017', time: '6:30 PM', open: true },
				{ date: 'March 11, 2017', time: '8:00 PM', open: true },
				{ date: 'March 11, 2017', time: '9:30 PM', open: true },
			],
		},
	};
}

/**
 * Get the selected date from the state tree
 */
function getSelectedDate(state) {
	return Object.keys(state.bookings)
		.map(function(date) {
			return state.bookings[date];
		})
		.filter(function(dateObj) {
			return dateObj.selected;
		})[0];
}

/**
 * Get the selected time from state
 */ 
function getSelectedTime(state) {
	return Object.keys(state.bookings)
		.reduce(function(prev, next) {
			return prev.concat(state.bookings[next].times);
		}, [])
		.filter(function(timeObj) {
			return timeObj.selected;
		})[0];
}

function emptyElement(element){
  var i = element.childNodes.length;
  while(i--){
    element.removeChild(element.lastChild);
  }
}

// Hide an element by id
function hide(id) {
	document.getElementById(id).classList.add('hide');
}

// Show an element by id
function show(id) {
	document.getElementById(id).classList.remove('hide');
}

/**
 * Handle when a date is clicked
 */
function handleDateClick(dateObj) {
	// Deselect currently selected
	var curr = getSelectedDate(state);

	// Only re-render stuff if we clicked something different
	if (curr !== dateObj) {
		// Nothing may be selected yet
		if (curr) {
			curr.selected = false;
		}

		// Select new state
		dateObj.selected = true;

		// Re-render
		render(state);
	}
}

/**
 * Handle when a time is clicked
 */
function handleTimeClick(timeObj) {
	// Deselect currently selected
	var curr = getSelectedTime(state);

	if (curr !== timeObj) {
		// Nothing may be selected yet
		if (curr) {
			curr.selected = false;
		}
		timeObj.selected = true;
		renderTimes(state);
	}
}

/**
 * Render all of the dates to the page
 */
function renderDates(state) {
	var elem = document.getElementById('js-date');
	emptyElement(elem);

	// Get all of the dates we have
	var dates = Object.keys(state.bookings);

	dates.forEach( function(date) {
		var li = document.createElement('li');
		li.innerText = date;
		li.onclick = handleDateClick.bind(null, state.bookings[date]);

		if (state.bookings[date].selected) {
			li.classList.add('selected');
		}

		elem.appendChild(li);
	});
}

/**
 * Render the times for the selected date
 */
function renderTimes(state) {
	var elem = document.getElementById('js-time');
	emptyElement(elem);

	// Check which date has been selected
	var selectedDate = getSelectedDate(state);

	// If none has been selected, we simply return
	if (!selectedDate) {
		show('select-a-date');
		hide('js-time');
		return;
	} else {
		show('js-time');
		hide('select-a-date');

		// Render all of the times
		selectedDate.times.forEach(function(time) {
			var li = document.createElement('li');
			li.innerText = time.time;
			li.onclick = handleTimeClick.bind(null, time);

			if (time.selected) {
				li.classList.add('selected');
			}

			elem.appendChild(li);
		});
	}
}

/**
 * Render the bookings to the page
 */
function renderBookings(bookings) {
	renderDates(state);
	renderTimes(state);
}

/**
 * Render the dynamic parts of the app
 */
function render(state) {
	renderBookings();
}

/**
 * Entry point for the page
 */
function init() {
	state.bookings = getBookings();
	render(state);
}

window.onload = init;


