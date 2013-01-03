/**
 * jQuery Plugin: Events Manager 1.0 by Slava Fomin II.
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

    var plugin_name = 'eventsManager';
    var debug       = true;

    var default_config = {};

    //=======================//
    // PUBLIC STATIC METHODS //
    //=======================//

    var StaticMethods =
    {
        setDebug: function(mode) {
            debug = (mode ? true : false);
        },

        newInstance: function(config)
        {
            if (typeof config != 'undefined' && typeof config != 'object') {
                debugOutput('incorrect configuration specified');
                return;
            }

            config = $.extend({}, default_config, config);

            var manager = {
                config        : config,
                events        : {},
                bind          : bind,
                trigger       : triggerMainWrapper,
                triggerResult : triggerResultWrapper
            };

            return manager;
        }
    };

    //=================//
    // PRIVATE METHODS //
    //=================//

    /**
     * Binds event handler for specified event.
     * @param event_name
     * @param handler
     * @param object this object will be passed to the specified event handler on every invoke
     * @return {*}
     */
    function bind(event_name, handler, object)
    {
        var manager = this;

        if (typeof event_name != 'string') {
            debugOutput('event name must be a string');
            return manager;
        }

        if (typeof handler != 'function') {
            debugOutput('handler must be a callback function');
            return manager;
        }

        if (typeof object != 'undefined' && typeof object != 'object') {
            debugOutput('object must be a javascript-object, you can also omit it');
            return queue;
        }

        if (typeof manager.events[event_name] == 'undefined') {
            manager.events[event_name] = [];
        }

        manager.events[event_name].push({
            handler : handler,
            object  : object
        });

        return manager;
    }

    /**
     * @exposed_method
     * @param event_name
     * @param event
     * @return {Object}
     */
    function triggerMainWrapper(event_name, event)
    {
        return trigger.call(this, event_name, event, false);
    }

    /**
     * @exposed_method
     * @param event_name
     * @param event
     * @return {Object}
     */
    function triggerResultWrapper(event_name, event)
    {
        return trigger.call(this, event_name, event, true);
    }

    /**
     * Invokes event handlers for specified event.
     * @param event_name
     * @param event
     * @param return_result whether to return last event handler's result or just event manager itself for chainability
     * @return {*}
     */
    function trigger(event_name, event, return_result)
    {
        var manager = this;

        if (typeof event_name != 'string') {
            debugOutput('event name must be a string');
            return manager;
        }

        // Saving last handler result for later use.
        var handler_result = null;

        if (typeof manager.events[event_name] != 'undefined') {
            $.each(manager.events[event_name], function(key, item) {
                handler_result = item.handler.call((item.object ? item.object : window), event);
                if (handler_result === false) {
                    // If handler returned false, then we break the loop and not
                    // invoke any further handlers.
                    return false;
                }
            });
        }

        if (return_result) {
            return handler_result;
        } else {
            return manager;
        }
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

            if(window.console) {
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