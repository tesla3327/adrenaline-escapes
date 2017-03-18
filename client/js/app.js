var state = {
	slideAnimation: true,
};

// These transitions are added without any delay
var transitionPrefix = ['background 0.2s ease', 'color 0.2s ease'];
var SERVER = location.protocol === 'file:'
	? 'http://localhost:3000/'
	: 'https://adrenaline-escapes.herokuapp.com/';

/**
 * Fetch bookings
 */
function getBookings(cb) {
	var req = new XMLHttpRequest();

	req.onload = function() {
		cb( JSON.parse(this.responseText) );
	};

	req.ontimeout = function() {
		bookingFailure();
	};

	req.timeout = 6000;
	req.open('GET', SERVER + 'bookings');
	req.send();
}

/**
 * Post data to server
 */
function makeBooking(data, cb) {
	var req = new XMLHttpRequest();

	req.onload = function() {
		cb(this);	
	};

	req.ontimeout = function() {
		bookingFailure();
	};

	req.timeout = 6000;
	req.open('POST', SERVER + 'booking');
	req.setRequestHeader('Content-Type', 'application/json');

	req.send(JSON.stringify(data));
}

function getValueOfInput(id) {
	return document.getElementById(id).value;
}

/**
 * Get booking info from the form
 */
function getBookingInfo() {
	return {
		name: getValueOfInput('name'),
		email: getValueOfInput('email'),
		phone: getValueOfInput('phone'),
		partySize: getValueOfInput('party-size'),
	};
}

function validatePartySize(partySize) {
	var valid = true;

	if (partySize === '') {
		valid = false;
	} else {
		try {
			var num = parseInt(partySize, 10);

			if (isNaN(num)) {
				valid = false;
			} else if (num > 8 || num < 2) {
				valid = false;
			}
		} catch (e) {
			valid = false;
			console.error(e);
		}
	}

	return valid;
}

/**
 * Validate the booking info
 */
function validateBookingInfo(info) {
	return {
		name: info.name !== '',
		email: info.email !== '',
		phone: info.phone !== '',
		partySize: validatePartySize(info.partySize),
	}
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

		// Deselect the time
		var selectedTime = getSelectedTime(state);
		if (selectedTime) {
			selectedTime.selected = false;
		}

		// Also hide the booking stuff
		hide('booking-info');
		hide('book');

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

	// We hide these until they can actually make the booking
	show('booking-info');
	show('book');

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
 * Make the booking!
 */
function handleBook() {
	// Get booking info
	var info = getBookingInfo();

	// Validate it
	var validation = validateBookingInfo(info);
	updateValidation(validation);

	// Check if we are valid and good to go!
	var good2go = Object.keys(validation).every(function(k) {
		return validation[k];
	});

	if (good2go) {
		// We need to put together the booking to send to the server
		info.date = getSelectedDate(state).date;
		info.time = getSelectedTime(state).time;

		// Make button spin
		document.getElementById('book').classList.add('loading');
		
		makeBooking(info, function(response) {
			if (response.status >= 200 && response.status < 300) {
				bookingSuccess(info);
			} else if (response.status === 404) {
				bookingTaken();
			} else {
				console.error(response);
				bookingFailure();
			}
		});
	}
}

/**
 * If the booking completes successfully
 */
function bookingSuccess(info) {
	// Populate success fields
	var date = new Date(info.date);
	document.getElementById('success-date').innerText = renderDateString(date);
	document.getElementById('success-time').innerText = info.time;

	hide('booking-content');
	show('booking-success');	

	// Scroll to show
	location = '#booking';
}

/**
 * If the booking runs into some error
 */
function bookingFailure() {
	console.log('Booking failed!');
	hide('booking-content');
	document.getElementById('book').classList.remove('loading');
	show('booking-failure');

	// Scroll to show
	location = '#booking';
}

/**
 * If the booking is already taken
 */
function bookingTaken() {
	console.log('Booking is taken');
	hide('booking-content');
	document.getElementById('book').classList.remove('loading');
	show('booking-taken');

	// Scroll to show
	location = '#booking';
}

/**
 * Update the form with the validation
 */
function updateValidation(v) {
	if (v.name) {
		hide('name-error');
	} else {
		show('name-error');
	}

	if (v.email) {
		hide('email-error');
	} else {
		show('email-error');
	}

	if (v.phone) {
		hide('phone-error');
	} else {
		show('phone-error');
	}

	if (v.partySize) {
		hide('party-size-error');
	} else {
		show('party-size-error');
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
 * Takes a date and returns the string
 */
var dateOptions = {
	weekday: 'long',
	year: 'numeric',
	month: 'long',
	day: 'numeric',
	timeZone: 'UTC',
};
function renderDateString(date) {
	return date.toLocaleString('en-US', dateOptions);
}

/**
 * Compares a UTC date to today (local-time), determining if the date is:
 * in the past: -1
 * today: 0
 * in the future: 1
 */
function getDateRelativeToToday(date) {
	var today = new Date(Date.now());

	// Compare year
	var year = date.getUTCFullYear() - today.getFullYear();

	// Compare month
	var month = date.getUTCMonth() - today.getMonth();

	// Compare day of the month
	var day = date.getUTCDate() - today.getDate();

	var relative = 0;
	if (year < 0 || (year === 0 && month < 0) || (year === 0 && month === 0 && day < 0)) {
		relative = -1;
	} else if (year > 0 || (year === 0 && month > 0) || (year === 0 && month === 0 && day > 0)) {
		relative = 1;
	}

	// Return an object with all comparisons
	return {
		year: year,
		month: month,
		day: day,
		relative: relative
	};
}

/**
 * Render all of the dates to the page
 */
function renderDates(state) {
	var elem = document.getElementById('js-date');
	emptyElement(elem);

	// Get all of the dates we have
	var dates = Object.keys(state.bookings);

	dates.forEach( function(dateId, i) {
		var dateObj = state.bookings[dateId];

		// Check where this date is relative to today
		var dateRelative = getDateRelativeToToday(new Date(dateObj.date));

		// If it's in the past we don't want to render it at all
		if (dateRelative.relative < 0) {
			return;
		}

		var li = document.createElement('li');
		li.innerText = renderDateString(new Date(dateObj.date));

		// Add style
		addListTransition(li, i);

		// Selected
		if (dateObj.selected) {
			li.classList.add('selected');
		}

		// Booked
		if (isDateFullyBooked(dateObj)) {
			li.classList.add('booked');
		} else {
			// Add click handler only if we can actually book it
			li.onclick = handleDateClick.bind(null, dateObj);
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

		// Compare the selected date to today
		var selectedDateObj = new Date(selectedDate.date);
		var dateRelative = getDateRelativeToToday(selectedDateObj);
		if (dateRelative.relative === 0) {
			show('custom-bookings');
		} else {
			hide('custom-bookings');

			// Render all of the times
			selectedDate.times.forEach(function(time, i) {
				var li = document.createElement('li');
				li.innerHTML = '<strong>' + time.time + '</strong><span class="date">' + selectedDateObj.toLocaleString('en-US', {
					weekday: 'long',
					month: 'long',
					day: 'numeric',
					timeZone: 'UTC',	
				}) + '</span>';

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
		}

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
 * Add the google maps page only once the page has finished loading
 */
var smallMaps = '<iframe width="700" height="400" frameborder="0" style="border:0; width:100%" src="https://www.google.com/maps/embed/v1/place?q=Adrenaline%20Escapes&zoom=14&key=AIzaSyAQN8hhRYLzI4fZ5F1Z3QAf7bzmz6DKn6I"></iframe>';
var largeMaps = '<iframe width="1200" height="500" frameborder="0" style="border:0; width:100%" src="https://www.google.com/maps/embed/v1/place?q=Adrenaline%20Escapes&zoom=15&key=AIzaSyAQN8hhRYLzI4fZ5F1Z3QAf7bzmz6DKn6I"></iframe>';
function loadGoogleMaps() {
	var width = window.innerWidth;

	var elem = document.createElement('div');
	elem.classList.add('google-map');

	// Small or large maps?
	if (width < 700) {
		elem.classList.add('small');
		elem.innerHTML = smallMaps;
	} else {
		elem.classList.add('large');
		elem.innerHTML = largeMaps;
	}

	var parent = document.getElementById('footer');
	var toReplace = document.getElementById('maps-placeholder');
	parent.replaceChild(elem, toReplace);
};	

/**
 * Entry point for the page
 */
function init() {
	getBookings(function(bookings) {
		state.bookings = bookings;
		render(state);

		// Only now do we get our maps
		loadGoogleMaps();
	});
}

window.onload = init;


