(function(){

    'use strict';

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Test harness that provides the getStatus method we'll be using
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    var reqCount = 0,
        readyOnTest = 10;

    /**
     * A function that pass an object to a callback function with a property of 'status' that will have a value of
     * 'notReady' until it has been called 10 times
     *
     * @param cb
     */
    function getStatus( cb ){

        reqCount++;

        cb({
            status: reqCount < readyOnTest ? 'notReady' : 'ready'
        });
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // The main pollForStatus base function. Used to build status polls with specific triggers and params
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Returns a function that will perform a status check and test it's results a limited number of times. The inner
     * function that is returned expects a configuration object that defines the maximum number of times the test should
     * be run, what the poll interval should be, what should happen on success, and what should happen on failure.
     *
     * <p>
     *     The format of the returned functions config object is:
     *     <pre>
     *      {
     *          maxTries: 5,
     *          pollTime: 1000,
     *          onSuccess: function(){ ... },
     *          onFail: function(){ ... }
     *      }
     *     </pre>
     * </p>
     *
     * @param getStatus             The function to call to fetch the status
     * @param statusResultSuccess   The function to test the status return against to determine success
     * @param statusResultAbort     The function to test the status return against to detect an abort condition
     * @returns {Function}
     */
    function createStatusPollFunction( getStatus, statusResultSuccess, statusResultAbort ){

        // The returned function, expects a config object
        return function( conf ){

            // The number of times the test has been run
            var testCount = 0;

            // Make sure the number of max tries is a number and greater than 0
            if( typeof conf.maxTries !== 'number' || conf.maxTries < 1 ){
                // If it's not, set the default to 10
                conf.maxTries = 10;
            }

            // Make sure the pollTime is a number and greater than 0
            if( typeof conf.pollTime !== 'number' || conf.pollTime < 1 ){
                // If it's not, set the default to 10
                conf.pollTime = 100;
            }

            // Begin the test cycle
            (function performStatusCheck(){

                // Count our test calls so we can max out
                testCount++;

                // Call the status check function
                getStatus( function( res ){

                    var canStillTry =   testCount < conf.maxTries,
                        succeeded =     statusResultSuccess( res ),
                        aborted =       statusResultAbort( res );

                    // Pass the latest response and test count to the onTic callback if it's defined
                    if( typeof conf.onTic === 'function'){
                        conf.onTic( res, testCount );
                    }

                    // Check for success...
                    if( canStillTry && !succeeded && !aborted ){
                        // We still have tests, haven't aborted and aren't successful yet... run the test (in a moment)
                        window.setTimeout( performStatusCheck, conf.pollTime );
                    } else {
                        // We were successful, ran out of tests or aborted
                        if( succeeded ){
                            conf.onSuccess();
                        } else {
                            conf.onFail();
                        }
                    }
                });
            })(); // end: performStatusCheck
        };
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Create a completed poll for status function that calls the getStatus test harness method and looks for a
    // returned status value of 'ready' to succeed or a value of 'abort' to abort.
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * A method provided by pollForStatus that expects a configuration object with properties for maxTries, pollTime,
     * onSuccess and onFail
     * @param conf          An object that configures the status poll
     */
    var readyStatusPoll = createStatusPollFunction(
        getStatus,
        function successCondition( res ){
            return res.status === 'ready';
        },
        function abortCondition( res ){
            return res.status === 'abort';
        });

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Configure the poll. It's started automatically.
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Poll until ready status is achieved or we run out of tests
    readyStatusPoll({
        maxTries: 20,
        pollTime: 100,
        onSuccess: function(){
            console.log( 'readyStatusPoll Ready!!!!' );
        },
        onFail: function(){
            console.log( 'Sorry, unable to achieve ready status in time.' );
        },
        onTic: function( res, ct ){
            console.log('readyStatusPoll onTic():' + ct, res);
        }
    });
})();