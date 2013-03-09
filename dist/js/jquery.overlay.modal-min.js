(function(G){var F="overlayModal";var z=false;var S={source:{type:null},windowMargin:{top:100,bottom:100},closable:true,title:"",eventHandlers:{open:null,opened:null,close:null,closed:null}};var I={html:"overlay-modal-html",window:"overlay-modal-window",content_wrapper:"overlay-modal-content-wrapper",close_button:"overlay-modal-close",window_header:"overlay-modal-window-header"};var K={close_title:"Закрыть"};var x=[];var O=false;var s=false;var T=false;var e=null;var y=null;var C=null;var v=null;var h=300;var L=300;var B=false;var f=0;var b=0;var R=0;var m=[];var o=null;var n={setDebug:function(U){z=(U?true:false)},newInstance:function(U){if(typeof U!="undefined"&&typeof U!="object"){N("options must be an object or omitted, "+typeof U+" given");U={}}if(!u()){return null}return w(U)}};function w(V){var W=G.extend({},S,V);var U={settings:W,initialized:false,window:null,eventsManager:null,open:A,close:M,bind:i};G.each(W.eventHandlers,function(Y,X){if(typeof X=="function"){U.bind(Y,X)}});return U}function j(){var U=this;if(U.initialized){return}if(!T){g()}l(U,function(V){if(!V.result){return}var W=G("<div />").addClass(I.window).click(function(Z){Z.stopPropagation()}).css({"margin-top":U.settings.windowMargin.top,"margin-bottom":U.settings.windowMargin.bottom});var Y=G("<div />").addClass(I.window_header);if(U.settings.closable){Y.append(G('<a href="#" />').attr("class",I.close_button).attr("title",K.close_title).click(function(){q();return false}))}if(U.settings.title){Y.append("<h1>"+U.settings.title+"</h1>")}W.append(Y);var X=G("<div />").attr("class",I.content_wrapper);X.append(V.content);W.append(X);C.append(W);U.window=W;U.initialized=true})}function A(){var U=this;if(P(U,"open")!==false){if(!U.initialized){j.call(U)}if(o){H(o)}if(!B){r()}m.push(U);o=U;t(U)}return U}function M(){var U=this;if(U===o){q()}}function i(X,W,V){var U=this;if(typeof G.eventsManager=="function"){if(!U.eventsManager){U.eventsManager=G.eventsManager("newInstance")}U.eventsManager.bind(X,W,V)}else{N("event manager is not available, your event handler can not be registered: "+X)}return U}function u(){if(!s){if(!k()){return false}e=G("html").first();y=G("body").first();C=G('<div id="overlay-modal-container" />').click(function(){q();return false});v=G('<span id="overlay-modal-cross" />').attr("title",K.close_title);C.append(v);s=true}return true}function g(){if(!T){y.append(C);G(document).keyup(function(U){if(U.keyCode==27){q()}});T=true}}function l(U,V){if(typeof U!="object"||U===null){N("instance is required and must be an object")}if(typeof V!="function"){N("callback is required and must be a function")}switch(U.settings.source.type.toLowerCase()){case"dom":E(U,V);break;case"ajax":c(U,V);break;default:N("unknown source type: "+U.settings.source.type)}}function E(U,X){var V=function(){X({result:false})};var W=null;if(typeof U.settings.source.element=="object"){W=U.settings.source.element}else{if(typeof U.settings.source.selector=="string"){W=G(U.settings.source.selector)}}if(W===null){N("element must be specified either as jQuery DOM element or as a proper selector");V();return}if(W.length!=1){N("only single element must be specified, collection given");V();return}X({result:true,content:W})}function c(U,V){V({result:false})}function Q(){f=e.scrollTop();b=y.scrollTop()}function J(){if(f>0){e.scrollTop(f)}if(b>0){y.scrollTop(b)}}function r(){if(B){return}Q();p();e.addClass(I.html);C.fadeIn(L);J();B=true}function D(){if(!B){return}C.fadeOut(h,function(){e.removeClass(I.html);J();d()});B=false}function t(U){U.window.show();if(U.settings.closable){v.show();C.css("cursor","pointer")}else{v.hide();C.css("cursor","default")}C.scrollTop(0);U.window.find("."+I.window_header).width(U.window.width());P(U,"opened")}function H(U){U.window.hide();P(U,"closed")}function q(){if(!o){N("there is no opened windows to close");return}if(!o.settings.closable){N("current windows is not closable");return}if(P(o,"close")===false){return}m.pop();H(o);var U=m.length;if(U>0){var V=m[U-1];t(V);o=V}else{o=null;D()}}function a(){var V=y.width();e.addClass(I.html);var U=y.width();e.removeClass(I.html);return Math.abs(V-U)}function p(){R=parseInt(y.css("margin-right"));y.css("margin-right",(R+a())+"px")}function d(){y.css("margin-right",R+"px")}function P(U,W,V){if(typeof V!="object"||!V){V={}}V.instance=U;if(U.eventsManager){return U.eventsManager.triggerResult(W,V)}return null}function k(){if(O){return true}var U=[];G.each(x,function(V,W){if(typeof G.fn[W]=="undefined"&&typeof G[W]=="undefined"){U.push(W)}});if(U.length>0){N("some jquery plugins are required for this plugin to work: "+U.join(", "));return false}O=true;return true}function N(U){if(z){U="["+F+"]: "+U;if(window.console){console.log(U)}else{alert(U)}}}G[F]=function(U){if(n[U]){return n[U].apply(window,(Array.prototype.slice.call(arguments,1)))}else{N('static method is not found "'+U+'"')}}})(jQuery);