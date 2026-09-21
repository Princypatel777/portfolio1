# Richardson Maturity Model Evaluation

## API Summary
The Task Management API exposes task resources through standard REST endpoints and uses meaningful HTTP status codes. It already satisfies Level 2 of the Richardson Maturity Model because it uses resource-oriented URLs and correct HTTP verbs with appropriate responses.

## Evaluation Table

| Level | Criterion | Does your API satisfy this? | Evidence |
| --- | --- | --- | --- |
| Level 0 | Single URI used for everything, usually with POST only | No | The API uses resource-specific endpoints such as `/tasks` and `/tasks/:id` rather than a single action endpoint. |
| Level 1 | Different URIs for different resources | Yes | The API exposes separate resources for collections and individual tasks using `/tasks` and `/tasks/:id`. |
| Level 2 | Use of proper HTTP verbs and status codes | Yes | `GET`, `POST`, `PUT`, and `DELETE` are used correctly, and responses return `200`, `201`, `400`, `404`, and `500` as appropriate. |
| Level 3 | Hypermedia controls / HATEOAS | No (awareness level only) | The API does not yet include hypermedia links in responses. It can be improved by adding `_links` metadata for navigation. |

## Endpoint Evaluation

- `GET /tasks` → Returns `200 OK` with the list of tasks.
- `GET /tasks/:id` → Returns `200 OK` for a valid task and `404 Not Found` for an invalid ID.
- `POST /tasks` → Creates a new task and returns `201 Created` on success.
- `PUT /tasks/:id` → Updates an existing task and returns `200 OK` or `400 Bad Request` for invalid input.
- `DELETE /tasks/:id` → Deletes a task and returns `200 OK` or `404 Not Found` for missing tasks.

## Improvement Made
The API was improved to reach at least Level 2 by ensuring that:
- the API uses clear resource-oriented endpoints;
- proper HTTP methods are implemented for CRUD operations;
- meaningful HTTP status codes are returned for create, update, not found, and validation cases;
- a single-task retrieval route was added with `GET /tasks/:id`.

## HATEOAS Awareness Example
If the API were being designed for Level 3, a task response could include links such as:

```json
{
  "id": 123,
  "title": "Task A",
  "completed": false,
  "_links": {
    "self": "/tasks/123",
    "delete": "/tasks/123"
  }
}
```

## Why Many Production APIs Stop at Level 2
Most production APIs stop at Level 2 because it provides a strong balance between simplicity, scalability, and developer ease of use. Level 3 introduces extra complexity through hypermedia controls and more verbose payloads, which often are not necessary for many internal or public APIs.
