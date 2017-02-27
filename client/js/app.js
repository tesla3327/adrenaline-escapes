var state = {
	slideAnimation: true,
};

// These transitions are added without any delay
var transitionPrefix = ['background 0.2s ease', 'color 0.2s ease'];
var SERVER = 'http://127.0.0.1:3000/';

/**
 * Stub out some data
 */
// function getBookings() {
// 	return {
// 		'March 3, 2017': {
// 			date: 'March 3, 2017',
// 			times: [
// 				{ date: 'March 3, 2017', time: '5:00 PM', booked: true },
// 				{ date: 'March 3, 2017', time: '6:30 PM', booked: true },
// 				{ date: 'March 3, 2017', time: '8:00 PM', booked: true },
// 				{ date: 'March 3, 2017', time: '9:30 PM', booked: true },
// 			],
// 		},
// 		'March 4, 2017': {
// 			date: 'March 4, 2017',
// 			times: [
// 				{ date: 'March 4, 2017', time: '2:00 PM', booked: false },
// 				{ date: 'March 4, 2017', time: '3:30 PM', booked: true },
// 				{ date: 'March 4, 2017', time: '5:00 PM', booked: true },
// 				{ date: 'March 4, 2017', time: '6:30 PM', booked: false },
// 				{ date: 'March 4, 2017', time: '8:00 PM', booked: false },
// 				{ date: 'March 4, 2017', time: '9:30 PM', booked: true },
// 			],
// 		},
// 		'March 10, 2017': {
// 			date: 'March 10, 2017',
// 			times: [
// 				{ date: 'March 10, 2017', time: '5:00 PM', booked: false },
// 				{ date: 'March 10, 2017', time: '6:30 PM', booked: false },
// 				{ date: 'March 10, 2017', time: '8:00 PM', booked: false },
// 				{ date: 'March 10, 2017', time: '9:30 PM', booked: false },
// 			],
// 		},
// 		'March 11, 2017': {
// 			date: 'March 11, 2017',
// 			times: [
// 				{ date: 'March 11, 2017', time: '2:00 PM', booked: false },
// 				{ date: 'March 11, 2017', time: '3:30 PM', booked: false },
// 				{ date: 'March 11, 2017', time: '5:00 PM', booked: false },
// 				{ date: 'March 11, 2017', time: '6:30 PM', booked: false },
// 				{ date: 'March 11, 2017', time: '8:00 PM', booked: false },
// 				{ date: 'March 11, 2017', time: '9:30 PM', booked: false },
// 			],
// 		},
// 	};
// }

/**
 * Fetch bookings
 */
function getBookings(cb) {
	var req = new XMLHttpRequest();

	req.onload = function() {
		cb( JSON.parse(this.responseText) );
	};

	req.open('GET', SERVER + 'bookings');
	req.send();
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

/**
 * Check if a date is fully booked
 */
function isDateFullyBooked(date) {
	return date.times.every(function(t) {
		return t.booked;
	});
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

	show('booking-info');

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
	li.style.transition = [
		'opacity 0.5s ease ' + (offset *  0.05) + 's',
		'transform 0.5s ease ' + (offset *  0.05) + 's',
	].concat(transitionPrefix).join(',');
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

		// Add style
		addListTransition(li, i);

		// Selected
		if (state.bookings[date].selected) {
			li.classList.add('selected');
		}

		// Booked
		if (isDateFullyBooked(state.bookings[date])) {
			li.classList.add('booked');
		} else {
			// Add click handler only if we can actually book it
			li.onclick = handleDateClick.bind(null, state.bookings[date]);
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

			addListTransition(li, i);

			if (time.selected) {
				li.classList.add('selected');
			}

			// If we are booked we don't need a click handler
			if (time.booked) {
				li.classList.add('booked');
			} else {
				li.onclick = handleTimeClick.bind(null, time);
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
	getBookings(function(bookings) {
		state.bookings = bookings;
		render(state);
	});
}

window.onload = init;


