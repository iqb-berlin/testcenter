# Modes for test execution

For the test or the survey, all execution parameters are given by 
the XML definition files. But before the test starts in production (hot) mode, there is 
the need to evaluate the test content and configuration. Then, some restrictions of the 
test may make it really hard to evaluate. For example, it would take too much time if 
you have to wait for the completion of all audio sequences. One could adapt the 
test definition for the evaluation period, but this is dangerous: After evaluation, you 
will change the test definition again and then risk new errors.

Our system allows multiple modes to run the test. Every login carries a token that declares 
this mode. You can first review only the design of the units and its arrangement, 
then switch on some restrictions and store responses, and finally evaluate the 
test like a testtaker.   

