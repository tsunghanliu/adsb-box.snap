//*** BEGIN USER DEFINED VARIABLES ***//

// Set the default time frame to use when loading images when the page is first accessed.
// Can be set to 1h, 6h, 24h, 7d, 30d, or 365d.
$timeFrame = '24h';

// Set this to the hostname of the system which is running dump1090.
$hostName = 'localhost';

// Set the page refresh interval in milliseconds.
$refreshInterval = 60000

//*** END USER DEFINED VARIABLES ***//


//*** DO NOT EDIT BELOW THIS LINE UNLESS YOU KNOW WHAT YOU ARE DOING ***//

// cookie related functions
function setCookie(cname, cvalue) {
	document.cookie = cname + "=" + cvalue + "; path=/";
}

function getCookie(cname) {
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for(var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

$(document).ready(function () {
	// Check for click events on the navbar burger icon
	$(".navbar-burger").on('click', function() {
		// Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
		$(".navbar-burger").toggleClass("is-active");
		$(".navbar-menu").toggleClass("is-active");
	});

	// UAT978 block
	if (has_uat == true) {
		$('#uat978-block').show();
	}
	else {
		$('#uat978-block').hide();
	}

	// Set default values for graphs
	var cval;
	cval = getCookie('range_unit');
	switch(cval) {
		case 'Nautical Miles':
		default:
			cval = 'Nautical Miles'; // update for default
			$('#range-unit-nautical-miles').addClass('is-active');
			break;
		case 'Statute Miles':
			$('#range-unit-statute-miles').addClass('is-active');
			break;
		case 'Kilometers':
			$('#range-unit-kilometers').addClass('is-active');
			break;
	}
	switchRangeGraph(cval);

	cval = getCookie('temp_unit');
	switch(cval) {
		case 'Metric':
		default:
			cval = 'Metric';	// update for default
			$('#temp-unit-metric').addClass('is-active');
			break;
		case 'Imperial':
			$('#temp-unit-imperial').addClass('is-active');
			break;
	}
	switchCoreTempGraph(cval);

	cval = getCookie('nic_name');
	switch(cval) {
		case 'eth0':
		default:
			cval = 'eth0';	// update for default
			$('#nic-name-eth0').addClass('is-active');
			break;
		case 'wlan0':
			$('#nic-name-wlan0').addClass('is-active');
			break;
	}
	switchNetBandwidthGraph(cval);

	$timeFrame = getCookie('report_period');
	switch($timeFrame) {
		case '1h':
			$('#report-period-1h').addClass('is-active');
			break;
		case '6h':
			$('#report-period-6h').addClass('is-active');
			break;
		case '24h':
		default:
			$timeFrame = '24h';
			$('#report-period-24h').addClass('is-active');
			break;
		case '7d':
			$('#report-period-7d').addClass('is-active');
			break;
		case '30d':
			$('#report-period-30d').addClass('is-active');
			break;
		case '365d':
			$('#report-period-365d').addClass('is-active');
			break;
	}

	// Display the images for the supplied time frame.
	switchView($timeFrame);

	// Refresh images contained within the page every X milliseconds.
	window.setInterval(function() {
		switchView($timeFrame)
	}, $refreshInterval);

	$(".report-period").on('click', function(){
		$(".report-period").removeClass("is-active");
		switchView($(this).children("label").attr("for"));
		$(this).addClass("is-active");
		setCookie('report_period', $(this).children("label").attr("for"));
	});

	$(".range-unit").on('click', function(){
		$(".range-unit").removeClass('is-active');
		switchRangeGraph($(this).text());
		switchView($timeFrame);
		$(this).addClass("is-active");
		setCookie('range_unit', $(this).text());
	});

	$(".temp-unit").on('click', function(){
		$(".temp-unit").removeClass("is-active");
		switchCoreTempGraph($(this).text());
		switchView($timeFrame);
		$(this).addClass("is-active");
		setCookie('temp_unit', $(this).text());
	});

	$(".nic-name").on('click', function(){
		$(".nic-name").removeClass('is-active');
		switchNetBandwidthGraph($(this).text());
		switchView($timeFrame);
		$(this).addClass("is-active");
		setCookie('nic_name', $(this).text());
	});

	setGraphLinkClickCB();

	$(".modal-close").on('click', function(){
		document.documentElement.classList.remove('is-clipped');
		$(".modal").removeClass("is-active");
	});

	$(".navbar-link").on('click', function(){
		$(this).siblings().toggleClass('is-hidden-mobile');
	});
});

function setGraphLinkClickCB() {
	$(".graph-link").on('click', function(){
		var img = $(this).children('figure').children('img');
		var modal = $("#modal-of-image");
		document.documentElement.classList.add('is-clipped');
		modal.attr('src', img.attr('src'));
		modal.attr('alt', img.attr('alt'));
		$("#modal-main").addClass('is-active');

		$(document).on('keyup', function(e){
			if (e.keyCode === 27) {
				$('.modal-close').click();	// Esc
				$(document).off('keyup');
			}
		});
	});
}

function switchRangeGraph(unit) {
	if (unit == "Nautical Miles") {
		$("#range-graph").html(
				"<a id =\"dump1090-range_imperial_nautical-link\" class=\"graph-link\">" +
				"	<figure class=\"image\">" +
				"		<img id=\"dump1090-range_imperial_nautical-image\" src=\"#\" alt=\"Max Range (Nautical Miles)\">" +
				"	</figure>" +
				"</a>"
				);
		$("#range-graph_978").html(
				"<a id =\"dump1090-range_978_imperial_nautical-link\" class=\"graph-link\">" +
				"	<figure class=\"image\">" +
				"		<img id=\"dump1090-range_978_imperial_nautical-image\" src=\"#\" alt=\"UAT Max Range (Nautical Miles)\">" +
				"	</figure>" +
				"</a>"
				);
	}
	else if (unit == "Statute Miles") {
		$("#range-graph").html(
				"<a id =\"dump1090-range_imperial_statute-link\" class=\"graph-link\">" +
				"	<figure class=\"image\">" +
				"		<img id=\"dump1090-range_imperial_statute-image\" src=\"#\" alt=\"Max Range (Statute Miles)\">" +
				"	</figure>" +
				"</a>"
				);
		$("#range-graph_978").html(
				"<a id =\"dump1090-range_978_imperial_statute-link\" class=\"graph-link\">" +
				"	<figure class=\"image\">" +
				"		<img id=\"dump1090-range_978_imperial_statute-image\" src=\"#\" alt=\"UAT Max Range (Statute Miles)\">" +
				"	</figure>" +
				"</a>"
				);
	}
	else if (unit == "Kilometers") {
		$("#range-graph").html(
				"<a id =\"dump1090-range_metric-link\" class=\"graph-link\">" +
				"	<figure class=\"image\">" +
				"		<img id=\"dump1090-range_metric-image\" src=\"#\" alt=\"Max Range (Kilometers)\">" +
				"	</figure>" +
				"</a>"
				);
		$("#range-graph_978").html(
				"<a id =\"dump1090-range_978_metric-link\" class=\"graph-link\">" +
				"	<figure class=\"image\">" +
				"		<img id=\"dump1090-range_978_metric-image\" src=\"#\" alt=\"Max Range (Kilometers)\">" +
				"	</figure>" +
				"</a>"
				);
	}
	else {
		alert("unsupported unit: " + unit);
		return;
	}

	setGraphLinkClickCB();
}

function switchCoreTempGraph(unit) {
	if (unit == "Metric") {
		$("#core-temp-graph").html(
				"<a id =\"system-temperature_metric-link\" class=\"graph-link\">" +
				"	<figure class=\"image\">" +
				"		<img id=\"system-temperature_metric-image\" class=\"img-responsive\" src=\"#\" alt=\"Core Temperature\">" +
				"	</figure>" +
				"</a>"
				);
	}
	else if (unit == "Imperial") {
		$("#core-temp-graph").html(
				"<a id =\"system-temperature_imperial-link\" class=\"graph-link\">" +
				"	<figure class=\"image\">" +
				"		<img id=\"system-temperature_imperial-image\" class=\"img-responsive\" src=\"#\" alt=\"Core Temperature\">" +
				"	</figure>" +
				"</a>"
				);
	}
	else {
		alert("unsupported unit: " + unit);
	}

	setGraphLinkClickCB();
}

function switchNetBandwidthGraph(nic) {
	if (nic == "eth0") {
		$("#nic-bandwidth-graph").html(
				"<a id =\"system-eth0_bandwidth-link\" class=\"graph-link\">" +
				"	<figure class=\"image\">" +
				"		<img id=\"system-eth0_bandwidth-image\" class=\"img-responsive\" src=\"#\" alt=\"Bandwidth Usage (eth0)\">" +
				"	</figure>" +
				"</a>"
				);
	}
	else if (nic == "wlan0") {
		$("#nic-bandwidth-graph").html(
				"<a id =\"system-wlan0_bandwidth-link\" class=\"graph-link\">" +
				"	<figure class=\"image\">" +
				"		<img id=\"system-wlan0_bandwidth-image\" class=\"img-responsive\" src=\"#\" alt=\"Bandwidth Usage (wlan0)\">" +
				"	</figure>" +
				"</a>"
				);
	}
	else {
		alert("unsupported nic: " + nic);
		return;
	}

	setGraphLinkClickCB();
}

function switchView(newTimeFrame) {
	// Set the the $timeFrame variable to the one selected.
	$timeFrame = newTimeFrame;

	// Set the timestamp variable to be used in querystring.
	$timestamp = new Date().getTime() / 1000

	// Display images for the requested time frame and create links to full sized images for the requested time frame.
	var element;

	$("#dump1090-local_trailing_rate-image").attr("src", "graphs/dump1090-" + $hostName + "-local_trailing_rate-" + $timeFrame + ".png?time=" + $timestamp);

	$("#dump1090-local_rate-image").attr("src", "graphs/dump1090-" + $hostName + "-local_rate-" + $timeFrame + ".png?time=" + $timestamp);

	$("#dump1090-aircraft_message_rate-image").attr("src", "graphs/dump1090-" + $hostName + "-aircraft_message_rate-" + $timeFrame + ".png?time=" + $timestamp);

	$("#dump1090-aircraft-image").attr("src", "graphs/dump1090-" + $hostName + "-aircraft-" + $timeFrame + ".png?time=" + $timestamp);

	$("#dump1090-tracks-image").attr("src", "graphs/dump1090-" + $hostName + "-tracks-" + $timeFrame + ".png?time=" + $timestamp);

	element =  document.getElementById('dump1090-range_imperial_nautical-image');
	if (typeof(element) != 'undefined' && element != null) {
		$("#dump1090-range_imperial_nautical-image").attr("src", "graphs/dump1090-" + $hostName + "-range_imperial_nautical-" + $timeFrame + ".png?time=" + $timestamp);
	}

	element =  document.getElementById('dump1090-range_imperial_statute-image');
	if (typeof(element) != 'undefined' && element != null) {
		$("#dump1090-range_imperial_statute-image").attr("src", "graphs/dump1090-" + $hostName + "-range_imperial_statute-" + $timeFrame + ".png?time=" + $timestamp);
	}

	element =  document.getElementById('dump1090-range_metric-image');
	if (typeof(element) != 'undefined' && element != null) {
		$("#dump1090-range_metric-image").attr("src", "graphs/dump1090-" + $hostName + "-range_metric-" + $timeFrame + ".png?time=" + $timestamp);
	}

	$("#dump1090-signal-image").attr("src", "graphs/dump1090-" + $hostName + "-signal-" + $timeFrame + ".png?time=" + $timestamp);

	$("#dump1090-cpu-image").attr("src", "graphs/dump1090-" + $hostName + "-cpu-" + $timeFrame + ".png?time=" + $timestamp);

	if (has_uat == true) {
		$("#dump1090-messages_978-image").attr("src", "graphs/dump1090-" + $hostName + "-messages_978-" + $timeFrame + ".png?time=" + $timestamp);

		$("#dump1090-aircraft_978-image").attr("src", "graphs/dump1090-" + $hostName + "-aircraft_978-" + $timeFrame + ".png?time=" + $timestamp);

		element =  document.getElementById('dump1090-range_978_imperial_nautical-image');
		if (typeof(element) != 'undefined' && element != null) {
			$("#dump1090-range_978_imperial_nautical-image").attr("src", "graphs/dump1090-" + $hostName + "-range_978_imperial_nautical-" + $timeFrame + ".png?time=" + $timestamp);
		}

		element =  document.getElementById('dump1090-range_978_imperial_statute-image');
		if (typeof(element) != 'undefined' && element != null) {
			$("#dump1090-range_978_imperial_statute-image").attr("src", "graphs/dump1090-" + $hostName + "-range_978_imperial_statute-" + $timeFrame + ".png?time=" + $timestamp);
		}

		element =  document.getElementById('dump1090-range_978_metric-image');
		if (typeof(element) != 'undefined' && element != null) {
			$("#dump1090-range_978_metric-image").attr("src", "graphs/dump1090-" + $hostName + "-range_978_metric-" + $timeFrame + ".png?time=" + $timestamp);
		}

		$("#dump1090-signal_978-image").attr("src", "graphs/dump1090-" + $hostName + "-signal_978-" + $timeFrame + ".png?time=" + $timestamp);
	}

	$("#system-cpu-image").attr("src", "graphs/system-" + $hostName + "-cpu-" + $timeFrame + ".png?time=" + $timestamp);

	element =  document.getElementById('system-eth0_bandwidth-image');
	if (typeof(element) != 'undefined' && element != null) {
		$("#system-eth0_bandwidth-image").attr("src", "graphs/system-" + $hostName + "-eth0_bandwidth-" + $timeFrame + ".png?time=" + $timestamp);
	}
	element =  document.getElementById('system-wlan0_bandwidth-image');
	if (typeof(element) != 'undefined' && element != null) {
		$("#system-wlan0_bandwidth-image").attr("src", "graphs/system-" + $hostName + "-wlan0_bandwidth-" + $timeFrame + ".png?time=" + $timestamp);
	}

	$("#system-memory-image").attr("src", "graphs/system-" + $hostName + "-memory-" + $timeFrame + ".png?time=" + $timestamp);

	element =  document.getElementById('system-temperature_imperial-image');
	if (typeof(element) != 'undefined' && element != null) {
		$("#system-temperature_imperial-image").attr("src", "graphs/system-" + $hostName + "-temperature_imperial-" + $timeFrame + ".png?time=" + $timestamp);
	}
	element =  document.getElementById('system-temperature_metric-image');
	if (typeof(element) != 'undefined' && element != null) {
		$("#system-temperature_metric-image").attr("src", "graphs/system-" + $hostName + "-temperature_metric-" + $timeFrame + ".png?time=" + $timestamp);
	}

	$("#system-df_root-image").attr("src", "graphs/system-" + $hostName + "-df_root-" + $timeFrame + ".png?time=" + $timestamp);

	$("#system-disk_io_iops-image").attr("src", "graphs/system-" + $hostName + "-disk_io_iops-" + $timeFrame + ".png?time=" + $timestamp);

	$("#system-disk_io_octets-image").attr("src", "graphs/system-" + $hostName + "-disk_io_octets-" + $timeFrame + ".png?time=" + $timestamp);
}

