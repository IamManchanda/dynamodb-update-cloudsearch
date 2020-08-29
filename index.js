const { config, CloudSearchDomain } = require("aws-sdk");
const async = require("async");

config.update({ region: "eu-west-1" });
const csd = new CloudSearchDomain({
  endpoint:
    "doc-td-notes-search-ydihnxbrr7rgygoo3nmxuhi4ee.eu-west-1.cloudsearch.amazonaws.com",
});

exports.handler = (event, context, callback) => {
  async.map(
    event.Records,
    (record, callbackMap) => {
      const user_id = record.dynamodb.Keys.user_id.S;
      const timestamp = record.dynamodb.Keys.timestamp.N;
      const id = `${user_id}-${timestamp}`;
      if (record.eventName === "REMOVE") {
        callbackMap(null, {
          type: "delete",
          id,
        });
      } else {
        const { newImage } = record.dynamodb;
        callbackMap(null, {
          type: "add",
          id,
          fields: {
            user_id: newImage.user_id.S,
            timestamp: newImage.timestamp.N,
            cat: newImage.cat.S,
            title: newImage.title.S,
            content: newImage.content.S,
            note_id: newImage.content.S,
            user_name: newImage.user_name.S,
            timestamp_expiry: newImage.timestamp_expiry.N,
          },
        });
      }
    },
    (error, results) => {
      csd.uploadDocuments(
        {
          contentType: "application/json",
          documents: JSON.stringify(results),
        },
        (err, data) => {
          if (err) {
            console.log(err);
          } else {
            console.log(data);
          }
        },
      );
      callback(null, "Execution completed");
    },
  );
};
