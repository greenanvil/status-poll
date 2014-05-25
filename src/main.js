(function(){

    'use strict';

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
     * @param getStatus         The function to call to fetch the status
     * @param statusResultTest  The function to test the status return against to determine success
     * @returns {Function}
     */
    function pollForStatus( getStatus, statusResultTest ){

        // The number of times the test has been run
        var testCount = 0;

        // The returned function, expects a config object
        return function( conf ){

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

                // Call the status check function
                getStatus( function( res ){

                    testCount++;

                    // Check for success...
                    if( testCount < conf.maxTries && !statusResultTest( res.status )){
                        // We still have tests and aren't successful yet... run the test again after a timeout
                        window.setTimeout( performStatusCheck, conf.pollTime );
                    } else {
                        // We were successful or ran out of tests
                        if( res.status === 'ready'){
                            conf.onSuccess();
                        } else {
                            conf.onFail();
                        }
                    }
                });
            })(); // end: performStatusCheck
        };
    }

    /**
     * A method provided by pollForStatus that expects a configuration object with properties for maxTries, pollTime,
     * onSuccess and onFail
     * @param conf          The configuration object
     */
    var pollForReadyStatus = pollForStatus(
        getStatus,
        function( status ){
            return status === 'ready';
        });


    // Poll until ready status is achieved or we run out of tests
    pollForReadyStatus({
        maxTries: 10,
        pollTime: 100,
        onSuccess: function(){
            console.log( 'Ready!!!!' );
        },
        onFail: function(){
            console.log( 'Sorry, unable to achieve ready status in time.' );
        }
    });

})();