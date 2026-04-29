0. Issue:
   - calulation of the total ticket pricing: anything that doesnt check for the status of the order before procceding will be wrong, since now we will have to add the tickets
1. Checkout workflow:
   - OnApprove:
     - udpates the status to confirme
     - routes.pushh to the confirmation page
   - Confirmation page:
     - Adds the tickes from the local storage to the db
     - does the logic for the refferal code

# Proposed solution:

- transfer the ticketing additon process form the confimation page to the checkout page
- check the queries that gets the tickets if they filter orders hy the status of the order
- the logic in the checkout page should be jsut to send the confirmation email and not update the status
