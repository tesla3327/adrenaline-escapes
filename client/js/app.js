var state = {
	slideAnimation: true,
};

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

		// We want to do the sliding animation
		state.slideAnimation = true;

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

	console.log(timeObj);

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
 * Adds a transition animation to a <li>
 */
function addListTransition(li, offset) {
	li.style.transition = 'all 0.5s ease ' + (offset *  0.05) + 's';
}

/**
 * Render all of the dates to the page
 */
function renderDates(state) {
	var elem = document.getElementById('js-date');
	emptyElement(elem);

	// Get all of the dates we have
	var dates = Object.keys(state.bookings);

	dates.forEach( function(date, i) {
		var li = document.createElement('li');
		li.innerText = date;
		li.onclick = handleDateClick.bind(null, state.bookings[date]);

		// Add style
		addListTransition(li, i);

		if (state.bookings[date].selected) {
			li.classList.add('selected');
		}

		elem.appendChild(li);
	});

	// The transition will not work without being "async"
	setTimeout(function() {
		elem.classList.add('appendCompleted');	
	}, 0);
}

/**
 * Render the times for the selected date
 */
function renderTimes(state) {
	var elem = document.getElementById('js-time');

	// If we want to do the slide animation
	if (state.slideAnimation) {
		elem.classList.remove('appendCompleted');
		state.slideAnimation = false;
	}
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
		selectedDate.times.forEach(function(time, i) {
			var li = document.createElement('li');
			li.innerText = time.time;
			li.onclick = handleTimeClick.bind(null, time);

			addListTransition(li, i);

			if (time.selected) {
				li.classList.add('selected');
			}

			elem.appendChild(li);
		});

		// The transition will not work without being "async"
		setTimeout(function() {
			elem.classList.add('appendCompleted');	
		}, 0);
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


