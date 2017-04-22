var state = {
	slideAnimation: true,
};

var moveTo = new MoveTo();

// These transitions are added without any delay
var transitionPrefix = ['background 0.2s ease', 'color 0.2s ease'];
var SERVER = location.protocol == 'file:'
	? 'http://localhost:3000/'
	: 'https://adrenaline-escapes.herokuapp.com/';

/**
 * Fetch bookings
 */
function getBookings(cb) {
	var req = new XMLHttpRequest();

	req.onload = function() {
		var data = JSON.parse(this.responseText);
		cb( adjustGroupings(data) );
	};

	req.ontimeout = function() {
		bookingFailure();
	};

	req.open('GET', SERVER + 'bookings');
	req.timeout = 6000;
	req.send();
}

/**
 * Fix ranges that may be in the past
 */
function adjustGroupings(groupings) {
	// Add some comparison meta data
	return groupings.map( function(grouping) {
		var result = grouping;
		result.startDateRelative = getDateRelativeToToday(new Date(grouping.startDate));
		result.endDateRelative = getDateRelativeToToday(new Date(grouping.endDate));

		return result;
	})
	// Filter out ranges completely in the past
	.filter( function(grouping) {
		return grouping.endDateRelative.relative >= 0;
	})
	// Update ranges that start in the past to start today
	.map( function(grouping) {
		if (grouping.startDateRelative.relative < 0) {
			var today = new Date(Date.now());

			// Convert to epoch and adjust for timezone
			// Timezone offset is in minutes
			var todayEpoch = today.valueOf() - (today.getTimezoneOffset() * 60 * 1000);

			// Remove seconds and milliseconds, because we only have the year, month day
			// in the date from the spreadsheet
			todayEpoch = todayEpoch - (todayEpoch % (1000 * 60 * 60 * 24));

			var result = grouping;
			result.startDate = todayEpoch;
			result.dates = removePastDates(grouping.dates);

			return result;
		} else {
			return grouping;
		}
	});
}

/**
 * Remove past dates from a list of date objects
 */
function removePastDates(dates) {
	return dates.filter(function(date) {
		return getDateRelativeToToday(new Date(date.date)).relative >= 0;
	});
}

/**
 * Post data to server
 */
function makeBooking(data, cb) {
	console.log(data);

	var req = new XMLHttpRequest();

	req.onload = function() {
		cb(this);	
	};

	req.ontimeout = function() {
		bookingFailure();
	};

	req.open('POST', SERVER + 'booking');
	req.timeout = 6000;
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
 * Get the selected grouping from the state tree
 */
function getSelectedGrouping(state) {
	return state.bookings.filter(function(dateObj) {
			return dateObj.selected;
		})[0];
}

/**
 * Get the selected time from state
 */ 
function getSelectedTime(state) {
	var result = state.bookings.reduce(function(prev, next) {
			return prev.concat(next.dates.reduce(function(prev, next) {
				return prev.concat(next.times);
			}, []));
		}, [])
		.filter(function(timeObj) {
			return timeObj.selected;
		})[0];

	// console.log('Selected:', result);
	return result;
}

/**
 * Check if a date is fully booked
 */
function isDateFullyBooked(date) {
	return date.times.every(function(t) {
		return t.booked;
	});
}

/**
 * Check if a booking group is fully booked
 */
function isGroupingFullyBooked(grouping) {
	return grouping.dates.every(isDateFullyBooked);
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
 * Handle when a grouping is clicked
 */
function handleGroupingClick(grouping) {
	// Deselect currently selected
	var curr = getSelectedGrouping(state);

	// Scroll to show the times
	setTimeout(function() {
		moveTo.move(document.getElementById('js-select-time'));
	}, 300);

	// Only re-render stuff if we clicked something different
	if (curr !== grouping) {
		// Nothing may be selected yet
		if (curr) {
			curr.selected = false;
		}

		// Select new state
		grouping.selected = true;

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
	console.log(timeObj);

	// Deselect currently selected
	var curr = getSelectedTime(state);

	// Scroll to show the times
	setTimeout(function() {
		moveTo.move(document.getElementById('booking-info'));
	}, 300);

	// We hide these until they can actually make the booking
	show('booking-info');
	show('book');

	// Render the time above the bookings form
	document.getElementById('js-booking-date').innerText = renderDateString(new Date(parseInt(timeObj.date, 10)));
	document.getElementById('js-booking-time').innerText = timeObj.time;

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
		var selectedTime = getSelectedTime(state);
		info.date = selectedTime.date;
		info.time = selectedTime.time;

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
		'opacity 0.5s ease ' + (offset *  0.03) + 's',
		'transform 0.5s ease ' + (offset *  0.03) + 's',
	].concat(transitionPrefix).join(',');
}

/**
 * Takes a date and returns the string
 */
var dateOptions = {
	weekday: 'long',
	// year: 'numeric',
	month: 'long',
	day: 'numeric',
	timeZone: 'UTC',
};
function renderDateString(date) {
	return date.toLocaleString('en-US', dateOptions);
}

/**
 * Render the string for the grouping
 */
function renderGroupingString(grouping) {
	var string = '';

	if (grouping.startDate === grouping.endDate) {
		string = renderDateString(new Date(grouping.startDate));
	} else {
		string = renderDateString(new Date(grouping.startDate)) +
			' - ' + renderDateString(new Date(grouping.endDate));
	}

	return string;
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
 * Render all of the groupings to the page
 */
function renderGroupings(state) {
	var elem = document.getElementById('js-date');
	emptyElement(elem);

	state.bookings.forEach( function(grouping, i) {
		// Check where this date is relative to today
		var dateRelative = getDateRelativeToToday(new Date(grouping.endDate));

		// If it's in the past we don't want to render it at all
		if (dateRelative.relative < 0) {
			return;
		}

		var li = document.createElement('li');
		li.innerText = renderGroupingString(grouping);

		// Add style
		addListTransition(li, i);

		// Selected
		if (grouping.selected) {
			li.classList.add('selected');
		}

		// Booked
		if (isGroupingFullyBooked(grouping)) {
			li.classList.add('booked');
		} else {
			// Add click handler only if we can actually book it
			li.onclick = handleGroupingClick.bind(null, grouping);
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
	}
	emptyElement(elem);

	// Check which date has been selected
	var selectedGrouping = getSelectedGrouping(state);

	// If none has been selected, we simply return
	if (!selectedGrouping) {
		show('select-a-date');
		hide('js-time');
		return;
	} else {
		show('js-time');
		hide('select-a-date');

		// Go through each date in the grouping
		var offset = 0;
		selectedGrouping.dates.forEach(function(date) {
			renderDate(elem, date, offset);
			offset += date.times.length;
		});
	}

	state.slideAnimation = false;
}

/**
 * Renders the times for a single date onto the page
 */
function renderDate(elem, dateToRender, offset) {
	// Compare the date to today
	var dateRelative = getDateRelativeToToday(new Date(dateToRender.date));

	// Create a list
	var listElem = document.createElement('ul');
	var dateString = renderDateString(new Date(parseInt(dateToRender.date, 10)));

	if (dateRelative.relative === 0) {
		listElem = document.createElement('p');
		listElem.innerHTML = '<em>Please call us for bookings today at:<br><span class="show-mobile"><a href="tel:204-380-4799">(204) 380-4799</a></span><span class="show-desktop"><strong>(204) 380-4799</strong></span></em>';
	} else {
		// Render all of the times
		dateToRender.times.forEach(function(time, i) {
			var li = document.createElement('li');
			li.innerHTML = dateString + '<span>' + time.time + '</span>';

			if (state.slideAnimation) {
				addListTransition(li, i + offset);
			}

			if (time.selected) {
				li.classList.add('selected');
			}

			// If we are booked we don't need a click handler
			if (time.booked) {
				li.classList.add('booked');
			} else {
				li.onclick = handleTimeClick.bind(null, time);
			}

			listElem.appendChild(li);
		});
	}

	// Create a heading for the date
	var headingElem = document.createElement('h4');
	headingElem.innerText = dateString;
	elem.appendChild(headingElem);
	elem.appendChild(listElem);

	// The transition will not work without being "async"
	setTimeout(function() {
		listElem.classList.add('appendCompleted');	
	}, 0);
}

/**
 * Render the bookings to the page
 */
function renderBookings(bookings) {
	renderGroupings(state);
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


