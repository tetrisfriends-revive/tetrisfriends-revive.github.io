var eventQueue = new Array();
var xfbmlItems = new Array();

var fb_api_id = "";
var fb_session_id = "";
var fb_uid = "";
var fb_user_cached = false;
var fb_already_linked = false;
var fb_cookie_data = new Array();
var fb_logged_in = false;
var fb_not_authorized = "";
var fb_access_token = "";
var tf_logged_in = false;
var tf_auto_login = false;
var tf_action_token = "";

var FB_GENERIC_ERROR			= "Doh! We seem to be experiencing issues at this time. Please refresh your page and try again.";
var FB_NOT_LOGGED_IN			= "You do not appear to be logged into Tetris Friends. Please <a href='/users/login.php'>Log in</a>.";
var FB_NOT_LOGGED_IN_FB			= "You do not appear to be logged into Facebook. Please <a href='javascript:fb_login()'>Log in</a> to Facebook.";
var FB_USER_NOT_FOUND			= "You do not appear to have a Tetris Friends account yet. Please <a href='/users/login.php'>Log in</a> to link your account or <a href='/users/register.php'>Sign-up</a> for a FREE account!";
var FB_SIGNATURE_FAIL			= "We were unable to log you into Tetris Friends at this time. Please try again.";
var FB_ACCOUNT_ALREADY_EXISTS	= "Your Facebook account already appears to be linked with another account.";
var FB_WRONG_ACCOUNT			= "Oops... you are logged in with the wrong Facebook Account. Please <a href='javascript:fb_login()'>Sign into Facebook again</a>.";
var FB_STATUS_CHANGED			= "Your Facebook Connect status appears to have changed... refreshing";
var FB_FEED_PUBLISHED			= "Your message has been posted to your feed.";
var FB_REVOKE_AUTHORIZATION		= "Unlinking your account with Facebook Connect. Please wait...";

var FB_DEBUG;
var FB_VERSION = "0.42";


function initFBConnect(inApiId, inFbUID, inFBUserCached, inTFLoggedIn, inAutoLogin, inTFActionToken, inTFRootPath) {
	fb_log("initFBConnect -> inApiId:" + inApiId +", fbUID:" + inFbUID + ", fbUserCached:" + inFBUserCached + ", tfLoggedIn:" + inTFLoggedIn + ", inAutoLogin:" + inAutoLogin + ", fbActionToken:" + inTFActionToken + ", inTFRootPath:" + inTFRootPath + ", " + FB_VERSION);

	fb_api_id = inApiId;
	fb_uid = inFbUID;
	fb_user_cached = inFBUserCached;
	tf_logged_in = inTFLoggedIn;
	tf_auto_login = inAutoLogin;
	tf_action_token = inTFActionToken;
	fb_log(inTFRootPath + "/channel.html");
	FB.init({
		appId: inApiId,
		status: true,
		cookie: true,
		xfbml: true,
		authResponse: true,
		channelUrl: "http://tetrisfriends.tetrisdev.com/channel.html"
	});
	
	fb_updateConnectStatus(function() {
		if (fb_getCookieValue("fb_force_refresh")) {
			fb_displayError("STATUS_CHANGED");
			fb_setCookieValue("fb_force_refresh", -1);
			setTimeout("fb_connectRefreshPage()", 3000);
		}
		
      	// Show XFBML when ready
      	fb_executeQueue();
	});
}
function fb_updateConnectStatus(callbackFunc) {
	fb_log("fb_updateConnectStatus");
	if (typeof(FB) != undefined && typeof(FB) != "undefined") {
		fb_log("if (typeof(FB) != undefined)");	
		FB.getLoginStatus(function(response) {
			fb_log("FB.getLoginStatus(function(response)");
			switch ( response.status ) {
				case "connected":
					fb_session_id = response.authResponse.userID;
					fb_access_token = response.authResponse.accessToken;
					
					fb_log("CONNECTED:" + (fb_session_id) + ", LOGGED INTO TF:" + tf_logged_in);
					
					fb_logged_in = true;
					fb_not_authorized = false;
					break;
				case "not_authorized":
					fb_log("NOT AUTHORIZED");
					fb_not_authorized = true;
					break;
				default:
					fb_log("NOT CONNECTED");
					fb_logged_in = false;
					break;
			}
			
			callbackFunc(response);
		});
	}
}
function fb_getSessionFBUID() {
	return fb_session_id;
}
function fb_getLinkedFBUID() {
	return ((fb_uid == "" || fb_uid == 0) ? "" : fb_uid);
}
function fb_setLinkedFBUID(inFbUID) {
	fb_uid = inFbUID;
}
function fb_isValidUser() {
	return (fb_getLinkedFBUID() == fb_getSessionFBUID() && fb_getLinkedFBUID() != "");
}
function fb_requireSession(callbackFunc) {
	fb_updateConnectStatus(function () {
		if (!fb_logged_in) {
			fb_log("REQUIRE SESSION");
			FB.login(callbackFunc);
		} else {
			fb_log("LOGGED IN");
			callbackFunc();
		}
	});
}
function fb_showGuestUpsell() {
	// if logged into FB but not TF 
	if (!fb_getCookieValue("hide_upsell")) {
		if ((!tf_logged_in && fb_not_authorized != "" && fb_not_authorized) || (fb_logged_in && !tf_logged_in)) {
			var height = 40;
			var animTime = 1000;
			var upsellHtml = "<p><a href=\"javascript:fb_login()\">Login</a> or <a href=\"javascript:fb_login()\">Sign-Up for FREE</a> using your Facebook account<p>"
						   + "<a class='fb_close_btn' href=\"javascript:fb_hideGuestUpsell()\">[X] Close</a>";
			
			$("#fb_notice").html(upsellHtml);
			
			$(document).ready(function() {
				$("#fb_notice").show();
			});
		}
	}
}
function fb_hideGuestUpsell() {
	$("#fb_notice").hide();
	fb_setCookieValue("hide_upsell", 1);
}

// Account Related
function fb_siteLogin(callbackFunc) {
	if (fb_logged_in) {
		fb_login();
	} else {
		displayLoginForm(true);
	}
}
function fb_login(callbackFunc) {
	fb_log("fb_login");
	if (typeof(callbackFunc) == "undefined" || typeof(callbackFunc) == undefined) {
		callbackFunc = fb_connectRefreshPage;
	}

	fb_updateConnectStatus(function() {
		fb_log("fb_updateConnectStatus");
		var fbLoginFunc = function () { FB.login(function () { fb_updateConnectStatus(fbLinkFunc) }) };
		var fbLinkFunc = function () { fb_linkFacebookAccount(callbackFunc) };
		
		if (!tf_logged_in) {
			fb_log("NOT LOGGED IN TF");
			fbLoginFunc = function () { FB.login( function() { fb_updateConnectStatus(function () { fb_TFLogin(fbLinkFunc) }) } ) };
		}  
		else if (!fb_logged_in) {
			fb_log("NOT LOGGED IN FB AND LOGGED INTO TF");
		}  
		else if (fb_logged_in && fb_getLinkedFBUID() == "" && !fb_already_linked) {
			fb_log("LOGGED IN AND AND NO FBUID");
		}
		else if (fb_logged_in && fb_getLinkedFBUID() != fb_getSessionFBUID()) {
			fb_log("LOGGED IN AND FBUID DO NOT MATCH");
			fbLoginFunc = FB.logout(fbLoginFunc);
		}
		else {
			fbLoginFunc = fbLinkFunc;
		}
		fbLoginFunc();
	});
}
function fb_logout() {
	fb_updateConnectStatus(function() {
		var logoutUrl = "/users/process.php?logout";

		if (fb_logged_in) {
			FB.logout(function() {
				window.location.href = logoutUrl;
			});
		} else {
			window.location.href = logoutUrl;
		}
	});
}
function fb_connectRefreshPage() {
	setTimeout("window.location.reload();", 250);
}

function fb_obtainRegistrationInfo() {
	addLoadingAnimation("#form_reg");
	
	fb_requireSession(function() {
		fb_getUserInfo(function(data) {
				$("#fb_uid").val(data[0].uid);
				$("#name").val(data[0].name);
				$("#pic").val(data[0].pic);
				$("#pic_small").val(data[0].pic_small);
				$("#pic_square").val(data[0].pic_square);
				removeLoadingAnimation("#form_reg");
		});
	});
}



function fb_linkFacebookAccount(callbackFunc) {
	if (typeof(callbackFunc) == "undefined" || typeof(callbackFunc) == undefined) {
		callbackFunc = fb_connectRefreshPage;
	}
	
	fb_getUserInfo(function(data) {
			$.post("/users/process.php", { link_fb_acct : 1, 
										   fb_uid : data[0].uid, 
										   name : data[0].name, 
										   pic : data[0].pic,
										   pic_small : data[0].pic_small, 
										   pic_square : data[0].pic_square, 
										   action_token: tf_action_token
										  },
										  function(data) {
											  switch (data) {
												case "SUCCESS":
													callbackFunc();
													break;
												default: 
													fb_displayError(data);
													break;
											  }
										  });
			});		
}

function fb_unlinkFacebookAccount(callbackFunc) {
	if (typeof(callbackFunc) == "undefined" || typeof(callbackFunc) == undefined) {
		callbackFunc = fb_connectRefreshPage;
	}
	
	$.post("/users/process.php", { unlink_fb_acct:1, action_token: tf_action_token }, 
			function(data) {
				switch (data) {
					case "SUCCESS":
						callbackFunc();
						break;
					default: 
						fb_displayError(data);
						break;
				}	
			});
}

function fb_TFLogin(callbackFunc) {
	if (typeof(callbackFunc) == "undefined" || typeof(callbackFunc) == undefined) {
		callbackFunc = fb_login;
	}
	
	fb_setCookieValue("fb_tf_login", 1);
	
	$.post("/users/process.php", { 
				login_with_fbuid:1, 
				fb_uid:fb_getSessionFBUID(), 
				action_token: tf_action_token
			}, 
			function(data) {
				switch (data) {
					case "SUCCESS":
						fb_setCookieValue("fb_tf_login", -1);
						callbackFunc();
						break;
					default: 
						fb_displayError(data);
						break;
				}
			});
}

function fb_newFacebookAccount(callbackFunc) {
	if (typeof(callbackFunc) == "undefined" || typeof(callbackFunc) == undefined) {
		callbackFunc = popUpFBLoginPopup;
	}
	fb_getFullUserInfo(function(data) {
		callbackFunc(data, tf_action_token);
	});	
}



// LIKE
function fb_getLikeUrl(customUrl, layout, width, height) {
	if (typeof(layout) == undefined || typeof(layout) == "undefined") {
		layout = "standard";
	}
	if (typeof(width) == undefined || typeof(width) == "undefined") {
		width = 90;
	}
	if (typeof(height) == undefined || typeof(height) == "undefined") {
		height = 21;
	}
	
	return "http://www.facebook.com/plugins/like.php?href=" + getBaseUrl(customUrl) + "&layout=" + layout + "&show_faces=false&width=" + width + "&action=recommend&font=trebuchet+ms&colorscheme=light&height=" + height;
}



// FQL Tools

function fb_getUserInfo(callback) {
	var query = fb_getFQLQueryString("user_info");
	try {
		fb_fqlQuery(query, function(rows) { 
			callback(rows);
		});
	} catch (ex) {
		fb_log("getUserInfo Fail:" + ex.message);
		throw ex;
	}
}
function fb_getFullUserInfo(callback) {
	var query = fb_getFQLQueryString("full_user_info");
	try {
		fb_fqlQuery(query, function(rows) { 
			callback(rows);
		});
	} catch (ex) {
		fb_log("fb_getFullUserInfo Fail:" + ex.message);
		throw ex;
	}
}
function fb_getUserFriendsList(callback) {
	if (fb_logged_in) {
		var query = fb_getFQLQueryString("friends_list");
		try {
			fb_fqlQuery(query, function(rows) {
				callback(rows);
			});
		} catch (ex) {
			fb_log("getUserFriendsList Fail:" + ex.message);
			throw ex;
		}
	} else {
		callback("FAILURE");
	}
}
function fb_getFQLQueryString(requestType) {
	var query = "";
	
	switch (requestType) {
		case "user_info":
			query =  "SELECT uid, name, pic, pic_small, pic_square FROM user WHERE uid = " + fb_session_id;
			break;
		case "full_user_info":
			query =  "SELECT uid, first_name, last_name, name, locale, timezone, birthday, sex, proxied_email, current_location, pic, pic_small, pic_square FROM user WHERE uid = " + fb_session_id;
			break;
		case "friends_list":
			query =  "SELECT uid, name, pic, pic_small, pic_square FROM user WHERE uid IN (SELECT uid2 FROM friend WHERE uid1 = " + fb_session_id + ")";
			break;
	}
	
	return query;
}
function fb_fqlQuery(query, callback) {
	fb_log("fb_fqlQuery -> " + query);

	try {
		FB.api({ method: 'fql.query', query: query }, callback);
	} catch (ex) {
		fb_log("Query Fail:" + ex.message);
		throw ex;
	}
}



// Error Notifications

function fb_log(inMsg) {
	if (typeof(FB_DEBUG) != "undefined" && typeof(FB_DEBUG) != undefined && FB_DEBUG) {
		console.log(inMsg);
	}
}

function fb_displayError(data) {
	if (typeof(FB_DEBUG) == "undefined" || typeof(FB_DEBUG) == undefined) {
		clearNotice();
	}
	
	switch (data) {
		case "USER_NOT_FOUND":
			addNotice(FB_USER_NOT_FOUND);
			fb_newFacebookAccount();
			break;
		case "NOT_LOGGED_IN":
			addNotice(FB_USER_NOT_FOUND);
			fb_newFacebookAccount();
			break;
		case "NOT_LOGGED_IN_FB":
			addNotice(FB_NOT_LOGGED_IN_FB);
			break;
		case "SIGNATURE_FAIL":
			addNotice(FB_SIGNATURE_FAIL);
			break;
		case "ACCOUNT_ALREADY_LINKED":
			addNotice(FB_WRONG_ACCOUNT);
			break;
		case "ACCOUNT_ALREADY_EXISTS":
			addNotice(FB_ACCOUNT_ALREADY_EXISTS);
			fb_already_linked = true;
			break;
		case "WRONG_ACCOUNT":
			addNotice(FB_WRONG_ACCOUNT);
			break;
		case "STATUS_CHANGED":
			addNotice(FB_STATUS_CHANGED);
			break;
		case "REVOKE_AUTHORIZATION":
			addNotice(FB_REVOKE_AUTHORIZATION);
			break;
		default:
			addNotice(FB_GENERIC_ERROR);
			if (FB_DEBUG) {
				alert(data);
			}
			break;
	}
}



//Utilities
function fb_setCookieValue(entryName, entryValue) {
	if (fb_cookie_data.length == 0) {
		fb_loadFBCookie();
	}
	
	var isFound = false;
	
	for(var i = 0; !isFound && i < fb_cookie_data.length; i++) {
		if (fb_cookie_data[i][0] == entryName) {
			fb_cookie_data[i][1] = entryValue;
			isFound = true;
		}
	}
	
	if (!isFound) {
		fb_cookie_data.push(new Array(entryName, entryValue));
	}
	
	fb_saveFBCookie();
}
function fb_getCookieValue(entryName) {
	var result = false;
	
	if (fb_cookie_data.length == 0) {
		fb_loadFBCookie();
	}
	
	for (var i = 0; !result && i < fb_cookie_data.length; i++) {
		if (fb_cookie_data[i][0] == entryName) {
			result = fb_cookie_data[i][1];
		}
	}
	return result;
}
function fb_saveFBCookie() {
	var cookieString = "";
	
	for (var i = 0; i < fb_cookie_data.length; i++) {
		if (fb_cookie_data[i][1] != -1 && typeof(fb_cookie_data[i][1]) != "undefined" && typeof(fb_cookie_data[i][1]) != undefined) {
			cookieString += fb_cookie_data[i][0] + ":" + fb_cookie_data[i][1];
			cookieString += "|";
		}
	}
	
	if (cookieString.substring(cookieString.length-1) == "|") {
		cookieString = cookieString.substring(0, cookieString.length-1);
	}
	
	$.cookie("TFFC", escape(cookieString), { path: "/" }); // Session cookie
}
function fb_loadFBCookie() {
	fb_cookie_data = new Array();
	var cookieString = $.cookie("TFFC");
	
	if (cookieString) {
		var cookie = unescape(cookieString);
		cookie = cookie.split('|');
		
		for(var i = 0; i < cookie.length; i++) {
			data = cookie[i].split(":");
			fb_cookie_data.push(new Array(data[0], data[1]));
		}
	}
}



// Event and XFBML Queues

function fb_execute(fbCommand) {
	if (typeof(FB) == "undefined" || typeof(FB) == undefined) {
		fb_pushCommand(fbCommand);
	} else {
		fbCommand();
	}
}
function fb_executeQueue(callbackFunc) {
	if (typeof(callbackFunc) == "undefined" || typeof(callbackFunc) == undefined) {
		callbackFunc = function () {};
	}
	
	for (var i = 0; i < eventQueue.length; i++) {
		var nextCommand = fb_popCommand();
		nextCommand();
	}
	
	callbackFunc();
}
function fb_pushCommand(fbCommand) {
	eventQueue.push(fbCommand);
}
function fb_popCommand() {
	return eventQueue.pop();
}



function fb_refreshXFBML() {
	FB.XFBML.parse();
}