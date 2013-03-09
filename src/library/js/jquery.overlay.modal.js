/**
 * Overlay Modal jQuery Plugin BETA by Slava Fomin II.
 *
 * Got any questions, ideas, propositions?
 * Feel free to contact me at: s.fomin [AT] betsol.ru
 *
 * From Russia with Love.
 * Let's make this World a Better place!
 */

(function($)
{
    //===========================//
    // PRIVATE STATIC PARAMETERS //
    //===========================//

    var plugin_name = 'overlayModal';

    var debug = false;

    var default_settings = {
        // Explore "loadContent()" for list of source types and their respected settings.
        source: {
            type: null
        },
        windowMargin: {
            top:    100,
            bottom: 100
        },

        // Whether this window can be closed using common controls.
        closable: true,

        // Window's title.
        title: '',

        eventHandlers: {
            open   : null,
            opened : null,
            close  : null,
            closed : null
        }
    };

    var css_classes = {
        html            : 'overlay-modal-html',
        window          : 'overlay-modal-window',
        content_wrapper : 'overlay-modal-content-wrapper',
        close_button    : 'overlay-modal-close',
        window_header   : 'overlay-modal-window-header'
    };

    var texts = {
        close_title: 'Закрыть'
    };

    var plugin_dependency = [];
    var dependencies_ok   = false;

    var static_initialized = false;
    var dom_initialized    = false;

    // Global references to some jQuery DOM elements.
    var $HTML      = null;
    var $Body      = null;
    var $Container = null;
    var $Cross     = null;

    var hide_duration = 300;
    var show_duration = 300;

    // Whether overlay shown right now or not.
    var overlay_shown = false;

    // Used in "captureScrolltop()" and "restoreScrolltop()" methods to store values.
    // Looks like different browsers use different elements to track page scrolling (html and body).
    // No need to change these manually.
    var html_scrolltop = 0;
    var body_scrolltop = 0;

    // Saving original body margin to restore it later.
    var body_margin_right = 0;

    // Stack of opened windows.
    // Each element is an instance of an overlay modal.
    var windows_stack = [];

    // Reference to the instance of currently opened window.
    // Only one instance can be active at given moment of time.
    var active_instance = null;

    //=======================//
    // PUBLIC STATIC METHODS //
    //=======================//

    var StaticMethods =
    {
        setDebug: function(mode) {
            debug = (mode ? true : false);
        },

        newInstance: function(options)
        {
            if (typeof options != 'undefined' && typeof options != 'object') {
                debugOutput('options must be an object or omitted, ' + typeof options + ' given');
                options = {};
            }

            if (!staticInitialization()) {
                return null;
            }

            return construct(options);
        }
    };

    //=========================//
    // EXPOSED PRIVATE METHODS //
    //=========================//

    function construct(options)
    {
        var settings = $.extend({}, default_settings, options);

        var instance = {
            // Parameters.
            settings      : settings,
            initialized   : false,
            'window'      : null,
            eventsManager : null,

            // Methods.
            open  : open,
            close : close,
            bind  : bind
        };

        $.each(settings.eventHandlers, function(event_name, handler) {
            if (typeof handler == 'function') {
                instance.bind(event_name, handler);
            }
        });

        return instance;
    }

    function initialize()
    {
        // Reference to overlay modal instance.
        var self = this;

        // Safety switch.
        if (self.initialized) {
            return;
        }

        // Global DOM should be initialized before first instance is initialized.
        if (!dom_initialized) {
            domInitialization();
        }

        loadWindowContent(self, function(response) {
            // Skipping instance initialization if we've failed to get the content.
            if (!response.result) {
                return;
            }

            var $Window = $('<div />')
                .addClass(css_classes.window)

                // Preventing overlay closing when user hit the window area.
                .click(function(event) {
                    event.stopPropagation();
                })

                // Applying styles.
                .css({
                    'margin-top'    : self.settings.windowMargin.top,
                    'margin-bottom' : self.settings.windowMargin.bottom
                })
            ;

            // Header.
            var $Header = $('<div />')
                .addClass(css_classes.window_header)
            ;

            // Window close button.
            if (self.settings.closable) {
                $Header.append(
                    $('<a href="#" />')
                        .attr('class', css_classes.close_button)
                        .attr('title', texts.close_title)
                        .click(function() {
                            closeActiveWindow();
                            return false;
                        })
                );
            }

            // Window title.
            if (self.settings.title) {
                $Header.append('<h1>' + self.settings.title + '</h1>');
            }

            // Appending header.
            $Window.append($Header);

            // Content wrapper.
            var $ContentWrapper = $('<div />')
                .attr('class', css_classes.content_wrapper)
            ;

            // Appending fetched content to the window.
            $ContentWrapper.append(response.content);
            $Window.append($ContentWrapper);

            // Appending initialized window to the overlay container.
            $Container.append($Window);

            self.window = $Window;

            // Marking this instance as initialized.
            self.initialized = true;
        });
    }

    function open()
    {
        // Reference to overlay modal instance.
        var self = this;

        if (triggerEvent(self, 'open') !== false) {
            if (!self.initialized) {
                initialize.call(self);
            }

            // Hiding previously opened window.
            if (active_instance) {
                hideWindow(active_instance);
            }

            // Showing overlay.
            if (!overlay_shown) {
                showOverlay();
            }

            // Adding current instance to the stack of opened windows.
            windows_stack.push(self);

            // Setting current instance as active instance.
            active_instance = self;

            // Showing current window.
            showWindow(self);
        }

        // Maintaining chainability.
        return self;
    }
    
    function close()
    {
        // Reference to overlay modal instance.
        var self = this;
        
        if (self === active_instance) {
            closeActiveWindow();
        }
    }

    function bind(event_name, handler, object)
    {
        // Reference to overlay modal instance.
        var self = this;

        if (typeof $.eventsManager == 'function') {
            if (!self.eventsManager) {
                self.eventsManager = $.eventsManager('newInstance');
            }
            self.eventsManager.bind(event_name, handler, object);
        } else {
            debugOutput('event manager is not available, your event handler can not be registered: ' + event_name);
        }

        return self;
    }

    //=================//
    // PRIVATE METHODS //
    //=================//

    function staticInitialization()
    {
        if (!static_initialized) {
            // Checking if plugin dependencies are satisfied.
            if (!checkDependencies()) {
                return false;
            }

            // Caching references to some global jQuery DOM elements.
            $HTML = $('html').first();
            $Body = $('body').first();

            $Container = $('<div id="overlay-modal-container" />')
                .click(function() {
                    closeActiveWindow();
                    return false;
                })
            ;

            $Cross = $('<span id="overlay-modal-cross" />')
                .attr('title', texts.close_title)
            ;

            $Container.append($Cross);

            static_initialized = true;
        }

        return true;
    }

    function domInitialization()
    {
        if (!dom_initialized) {
            $Body.append($Container);

            // When user hits escape key.
            $(document).keyup(function(event) {
                if (event.keyCode == 27) {
                    closeActiveWindow();
                }
            });

            dom_initialized = true;
        }
    }

    function loadWindowContent(instance, callback)
    {
        if (typeof instance != 'object' || instance === null) {
            debugOutput('instance is required and must be an object');
        }

        if (typeof callback != 'function') {
            debugOutput('callback is required and must be a function');
        }

        switch (instance.settings.source.type.toLowerCase()) {
            case 'dom':
                loadWindowContentDOM(instance, callback);
                break;
            case 'ajax':
                loadWindowContentAJAX(instance, callback);
                break;
            default:
                debugOutput('unknown source type: ' + instance.settings.source.type);
        }
    }

    function loadWindowContentDOM(instance, callback)
    {
        // Just some DRY.
        var failCallback = function() {
            callback({
                result: false
            });
        }

        // Getting element using element or selector instance properties.
        var $Element = null;
        if (typeof instance.settings.source.element == 'object') {
            $Element = instance.settings.source.element;
        } else if (typeof instance.settings.source.selector == 'string') {
            $Element = $(instance.settings.source.selector);
        }

        if ($Element === null) {
            debugOutput('element must be specified either as jQuery DOM element or as a proper selector');
            failCallback();
            return;
        }

        if ($Element.length != 1) {
            debugOutput('only single element must be specified, collection given');
            failCallback();
            return;
        }

        callback({
            result  : true,
            content : $Element
        });
    }

    function loadWindowContentAJAX(instance, callback)
    {
        callback({
            result: false
        });
    }

    function captureScrolltop()
    {
        html_scrolltop = $HTML.scrollTop();
        body_scrolltop = $Body.scrollTop();
    }

    function restoreScrolltop()
    {
        if (html_scrolltop > 0) {
            $HTML.scrollTop(html_scrolltop);
        }
        if (body_scrolltop > 0) {
            $Body.scrollTop(body_scrolltop);
        }
    }

    function showOverlay()
    {
        if (overlay_shown) {
            return;
        }

        captureScrolltop();
        lockBodyWidth();

        $HTML.addClass(css_classes.html);

        $Container.fadeIn(show_duration);

        restoreScrolltop();

        overlay_shown = true;
    }

    function hideOverlay()
    {
        if (!overlay_shown) {
            return;
        }

        $Container.fadeOut(hide_duration, function() {
            $HTML.removeClass(css_classes.html);
            restoreScrolltop();
            unlockBodyWidth();
        });

        overlay_shown = false;
    }

    function showWindow(instance)
    {
        instance.window.show();

        // Handling closability.
        if (instance.settings.closable) {
            $Cross.show();
            $Container.css('cursor', 'pointer');
        } else {
            $Cross.hide();
            $Container.css('cursor', 'default');
        }

        $Container.scrollTop(0);

        // Setting header's width equal to window's width.
        // This is required for IE7.
        instance.window.find('.' + css_classes.window_header).width(
            instance.window.width()
        );

        // Firing event.
        triggerEvent(instance, 'opened');
    }

    function hideWindow(instance)
    {
        instance.window.hide();

        // Firing event.
        triggerEvent(instance, 'closed');
    }

    /**
     * Closes active window and shows previous one from stack or
     * just hides the overlay if no windows left in stack.
     */
    function closeActiveWindow()
    {
        if (!active_instance) {
            debugOutput('there is no opened windows to close');
            return;
        }

        if (!active_instance.settings.closable) {
            debugOutput('current windows is not closable');
            return;
        }

        if (triggerEvent(active_instance, 'close') === false) {
            return;
        }

        // Removing active window from stack.
        windows_stack.pop();

        // Hiding active window.
        hideWindow(active_instance);

        var stack_size = windows_stack.length;

        if (stack_size > 0) {
            // Showing previous window from stack.
            var prev_instance = windows_stack[stack_size - 1];
            showWindow(prev_instance);
            active_instance = prev_instance;
        } else {
            // Hiding overlay, cause no more windows left in stack.
            active_instance = null;
            hideOverlay();
        }
    }

    function getBodyVerticalScrollbarWidth()
    {
        var body_width_1 = $Body.width();
        $HTML.addClass(css_classes.html);
        var body_width_2 = $Body.width();

        $HTML.removeClass(css_classes.html);

        return Math.abs(body_width_1 - body_width_2);
    }

    function lockBodyWidth()
    {
        body_margin_right = parseInt($Body.css('margin-right'));
        $Body.css('margin-right', (body_margin_right + getBodyVerticalScrollbarWidth()) + 'px');
    }

    function unlockBodyWidth()
    {
        $Body.css('margin-right', body_margin_right + 'px');
    }

    function triggerEvent(instance, event_name, event)
    {
        if (typeof event != 'object' || !event) {
            event = {};
        }
        
        event.instance = instance;
        
        if (instance.eventsManager) {
            return instance.eventsManager.triggerResult(event_name, event);
        }

        return null;
    }

    /**
     * Checks whether plugin-dependencies are satisfied.
     * Returns true on success, false otherwise.
     * @return boolean
     */
    function checkDependencies()
    {
        if (dependencies_ok) {
            return true;
        }

        var missing_plugins = [];
        $.each(plugin_dependency, function(key, plugin) {
            if (typeof $.fn[plugin] == 'undefined' && typeof $[plugin] == 'undefined') {
                missing_plugins.push(plugin);
            }
        });
        if (missing_plugins.length > 0) {
            debugOutput('some jquery plugins are required for this plugin to work: ' + missing_plugins.join(', '));
            return false;
        }

        dependencies_ok = true;
        return true;
    }

    /**
     * Outputs message to a debug stream.
     * @param message message to output.
     */
    function debugOutput(message)
    {
        // Only if "debug" flag is set with "setDebug" static method.
        if (debug) {
            message = '[' + plugin_name + ']: ' + message;

            if (window.console) {
                console.log(message);
            } else {
                alert(message);
            }
        }
    }

    //==============//
    // ENTRY POINTS //
    //==============//

    /**
     * Public static entry point.
     * @param method method name to call.
     */
    $[plugin_name] = function(method)
    {
        if (StaticMethods[method]) {
            return StaticMethods[method].apply(window, (Array.prototype.slice.call(arguments, 1)));
        } else {
            debugOutput('static method is not found "' + method + '"');
        }
    };

})(jQuery);