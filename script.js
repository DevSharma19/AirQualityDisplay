function handleButtonClick() {
	getMeasurements();
}

function handleShowInformation() {
	if (document.getElementById('extra-info').style.display === 'none') {
		document.getElementById('extra-info').style.display = 'block';
		document.getElementById('show-info').innerHTML = '▲ Show Less';
	} else {
		document.getElementById('extra-info').style.display = 'none';
		document.getElementById('show-info').innerHTML = '▼ Show More';
	}
}

function getMeasurements() {
	console.log('Air Quality measurements called');
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function (position) {
			var lat = position.coords.latitude;
			var long = position.coords.longitude;

			var rlat = Math.round(lat * 10000000) / 10000000;
			var rlong = Math.round(long * 10000000) / 10000000;

			getJSON(
				'https://api.openaq.org/v1/latest?coordinates=' +
					rlat +
					',' +
					rlong +
					'&radius=10000',
				function (err, data) {
					if (err) {
						document.getElementById('modal-body-content').innerHTML =
							'Unable to access API';
						return;
					} else {
						if (data.results) {
							if (data.meta.found < 1) {
								document.getElementById('modal-body-content').innerHTML =
									'No air quality data found near you';
								return;
							} else {
								var measurements = data.results[0].measurements;
								var subIndices = [];
								for (var i = 0; i < measurements.length; i++) {
									subIndices.push(
										getSubIndex(
											measurements[i].parameter,
											measurements[i].value
										)
									);
								}
								subIndices.sort(function (a, b) {
									return a - b;
								});

								var data1, data2;
								if (subIndices.length % 2 == 0) {
									data1 = subIndices.slice(0, subIndices.length / 2);
									data2 = subIndices.slice(
										subIndices.length / 2,
										subIndices.length
									);
								} else {
									data1 = subIndices.slice(0, subIndices.length / 2);
									data2 = subIndices.slice(
										subIndices.length / 2 + 1,
										subIndices.length
									);
								}

								var q1 = getMedian(data1);
								var q3 = getMedian(data2);
								var lower = q1 - (1.5 * q3 - q1);
								var upper = q3 + (1.5 * q3 - q1);

								for (var i = 0; i < subIndices.length; i++) {
									if (subIndices[i] < lower || subIndices[i] > upper) {
										subIndices.splice(i, 1);
									}
								}

								var index = Math.max(...subIndices);
								document.getElementById('aqi-display').innerHTML =
									'Current AQI is ' + index.toFixed(3);

								document.getElementById('category-display').style.color = 'white';
								if (index < 50) {
									document.getElementById('category-display').innerHTML =
										'AQI category is Good';
									document.getElementById('category-display').style.background =
										'green';
								} else if (index < 100) {
									document.getElementById('category-display').innerHTML =
										'AQI category is Moderate';
									document.getElementById('category-display').style.background =
										'yellow';
								} else if (index < 150) {
									document.getElementById('category-display').innerHTML =
										'AQI category is Unhealthy For Sensitive Groups';
									document.getElementById('category-display').style.background =
										'orange';
								} else if (index < 200) {
									document.getElementById('category-display').innerHTML =
										'AQI category is Unhealthy';
									document.getElementById('category-display').style.background =
										'red';
								} else if (index < 300) {
									document.getElementById('category-display').innerHTML =
										'AQI category is Very Unhealthy';
									document.getElementById('category-display').style.background =
										'purple';
								} else {
									document.getElementById('category-display').innerHTML =
										'AQI category is Hazardous';
									document.getElementById('category-display').style.background =
										'maroon';
								}

								var location = data.results[0].location;
								var city = data.results[0].city;
								var country = data.results[0].country;
								var distance = data.results[0].distance;
								var parameters = [];
								var dateUpdates = [];
								for (var i = 0; i < measurements.length; i++) {
									parameters.push(measurements[i].parameter);

									var date = measurements[i].lastUpdated;
									dateUpdates.push(
										date.slice(8, 10) +
											'/' +
											date.slice(5, 7) +
											'/' +
											date.slice(0, 4)
									);
								}

								document.getElementById('extra-info').innerHTML =
									'Your location was found at ' +
									lat.toFixed(2) +
									', ' +
									long.toFixed(2) +
									'<br>';
								document.getElementById('extra-info').innerHTML +=
									'Your air quality data was found at ' + location + '<br>';
								document.getElementById('extra-info').innerHTML +=
									'The location is located in ' + city + ', ' + country + '<br>';
								document.getElementById('extra-info').innerHTML +=
									'The location is ' +
									distance.toFixed() +
									'm away from you' +
									'<br>';
								document.getElementById('extra-info').innerHTML +=
									'The data included the following parameters : ';
								for (var i = 0; i < parameters.length; i++) {
									document.getElementById('extra-info').innerHTML +=
										parameters[i].toUpperCase() +
										' (' +
										dateUpdates[i] +
										')' +
										', ';
								}
							}
						}
					}
				}
			);
		});
	} else {
		document.getElementById('modal-body-content').innerHTML = 'Unable to access location';
		return;
	}
}

function getSubIndex(parameter, value) {
	let hiAQI, loAQI, hiBP, loBP;
	if (parameter === 'pm25') {
		if (value < 12) {
			hiAQI = 50;
			loAQI = 0;
			hiBP = 12;
			loBP = 0;
		} else if (value < 35.4) {
			hiAQI = 100;
			loAQI = 51;
			hiBP = 35.4;
			loBP = 12.1;
		} else if (value < 55.4) {
			hiAQI = 150;
			loAQI = 101;
			hiBP = 55.4;
			loBP = 35.5;
		} else if (value < 150.4) {
			hiAQI = 200;
			loAQI = 151;
			hiBP = 150.4;
			loBP = 55.5;
		} else if (value < 250.4) {
			hiAQI = 300;
			loAQI = 201;
			hiBP = 250.4;
			loBP = 150.5;
		} else if (value < 350.4) {
			hiAQI = 400;
			loAQI = 301;
			hiBP = 350.4;
			loBP = 250.5;
		} else if (value < 500.4) {
			hiAQI = 500;
			loAQI = 401;
			hiBP = 500.4;
			loBP = 350.5;
		} else {
			hiAQI = 999;
			loAQI = 501;
			hiBP = 99999.9;
			loBP = 500.5;
		}

		return ((hiAQI - loAQI) / (hiBP - loBP)) * (value - loBP) + loAQI;
	} else if (parameter === 'pm10') {
		if (value < 54) {
			hiAQI = 50;
			loAQI = 0;
			hiBP = 54;
			loBP = 0;
		} else if (value < 154) {
			hiAQI = 100;
			loAQI = 51;
			hiBP = 154;
			loBP = 55;
		} else if (value < 254) {
			hiAQI = 150;
			loAQI = 101;
			hiBP = 254;
			loBP = 155;
		} else if (value < 354) {
			hiAQI = 200;
			loAQI = 151;
			hiBP = 354;
			loBP = 255;
		} else if (value < 424) {
			hiAQI = 300;
			loAQI = 201;
			hiBP = 424;
			loBP = 355;
		} else if (value < 504) {
			hiAQI = 400;
			loAQI = 301;
			hiBP = 504;
			loBP = 425;
		} else if (value < 604) {
			hiAQI = 500;
			loAQI = 401;
			hiBP = 604;
			loBP = 505;
		} else {
			hiAQI = 999;
			loAQI = 501;
			hiBP = 99999;
			loBP = 605;
		}

		return ((hiAQI - loAQI) / (hiBP - loBP)) * (value - loBP) + loAQI;
	} else if (parameter === 'so2') {
		if (value < 35) {
			hiAQI = 50;
			loAQI = 0;
			hiBP = 35;
			loBP = 0;
		} else if (value < 75) {
			hiAQI = 100;
			loAQI = 51;
			hiBP = 75;
			loBP = 36;
		} else if (value < 185) {
			hiAQI = 150;
			loAQI = 101;
			hiBP = 185;
			loBP = 76;
		} else if (value < 304) {
			hiAQI = 200;
			loAQI = 151;
			hiBP = 304;
			loBP = 186;
		} else {
			hiAQI = 200;
			loAQI = 200;
			hiBP = 99999;
			loBP = 305;
		}

		return ((hiAQI - loAQI) / (hiBP - loBP)) * (value - loBP) + loAQI;
	} else if (parameter === 'no2') {
		if (value < 53) {
			hiAQI = 50;
			loAQI = 0;
			hiBP = 53;
			loBP = 0;
		} else if (value < 100) {
			hiAQI = 100;
			loAQI = 51;
			hiBP = 100;
			loBP = 54;
		} else if (value < 360) {
			hiAQI = 150;
			loAQI = 101;
			hiBP = 360;
			loBP = 101;
		} else if (value < 649) {
			hiAQI = 200;
			loAQI = 151;
			hiBP = 649;
			loBP = 361;
		} else if (value < 1249) {
			hiAQI = 300;
			loAQI = 201;
			hiBP = 1249;
			loBP = 650;
		} else if (value < 1649) {
			hiAQI = 400;
			loAQI = 301;
			hiBP = 1649;
			loBP = 1250;
		} else if (value < 2049) {
			hiAQI = 500;
			loAQI = 401;
			hiBP = 2049;
			loBP = 1650;
		} else {
			hiAQI = 999;
			loAQI = 501;
			hiBP = 99999;
			loBP = 2050;
		}

		return ((hiAQI - loAQI) / (hiBP - loBP)) * (value - loBP) + loAQI;
	} else if (parameter === 'o3') {
		if (value < 0.124) {
			hiAQI = -1;
			loAQI = -1;
			hiBP = 0.124;
			loBP = 0;
		} else if (value < 0.164) {
			hiAQI = 150;
			loAQI = 101;
			hiBP = 0.164;
			loBP = 0.125;
		} else if (value < 0.204) {
			hiAQI = 200;
			loAQI = 151;
			hiBP = 0.204;
			loBP = 0.165;
		} else if (value < 0.404) {
			hiAQI = 300;
			loAQI = 201;
			hiBP = 0.404;
			loBP = 0.205;
		} else if (value < 0.504) {
			hiAQI = 400;
			loAQI = 301;
			hiBP = 0.504;
			loBP = 0.405;
		} else if (value < 0.604) {
			hiAQI = 500;
			loAQI = 401;
			hiBP = 0.604;
			loBP = 0.505;
		} else {
			hiAQI = 999;
			loAQI = 501;
			hiBP = 99999;
			loBP = 0.605;
		}

		return ((hiAQI - loAQI) / (hiBP - loBP)) * (value - loBP) + loAQI;
	} else if (parameter === 'co') {
		if (value < 4.4) {
			hiAQI = 50;
			loAQI = 0;
			hiBP = 4.4;
			loBP = 0;
		} else if (value < 9.4) {
			hiAQI = 100;
			loAQI = 51;
			hiBP = 9.4;
			loBP = 4.5;
		} else if (value < 12.4) {
			hiAQI = 150;
			loAQI = 101;
			hiBP = 12.4;
			loBP = 9.5;
		} else if (value < 15.4) {
			hiAQI = 200;
			loAQI = 151;
			hiBP = 15.4;
			loBP = 12.5;
		} else if (value < 30.4) {
			hiAQI = 300;
			loAQI = 201;
			hiBP = 30.4;
			loBP = 15.5;
		} else if (value < 40.4) {
			hiAQI = 400;
			loAQI = 301;
			hiBP = 40.4;
			loBP = 30.5;
		} else if (value < 50.4) {
			hiAQI = 500;
			loAQI = 401;
			hiBP = 50.4;
			loBP = 40.5;
		} else {
			hiAQI = 999;
			loAQI = 501;
			hiBP = 99999;
			loBP = 50.5;
		}

		return ((hiAQI - loAQI) / (hiBP - loBP)) * (value - loBP) + loAQI;
	} else {
		return 0;
	}
}

function getJSON(url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.responseType = 'json';
	xhr.onload = function () {
		var status = xhr.status;
		if (status === 200) {
			callback(null, xhr.response);
		} else {
			callback(status, xhr.response);
		}
	};
	xhr.send();
}

function getMedian(arr) {
	if (arr.length % 2 == 0) return (arr[arr.length / 2] + arr[arr.length / 2 - 1]) / 2;
	else return arr[arr.length / 2];
}
