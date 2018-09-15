# Pooling contract

It consists of two contracts : a library and a "normal" contract. Using this method, it's cheaper (53%) in terms of gas used to deploy. You will have to search by yourself on how to link the library code into the other contract.


# Warnings

You are responsible for the use of the code. You are responsible for auditing the code.

# Setting up a pool

When setting the fee, it has to be calculated by yourself using the following formula : `1/fee`.

Example : `1% fee -> input = 1/0.01 = 100`.
