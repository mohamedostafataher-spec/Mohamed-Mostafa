const VISITOR_ID_KEY = 'sulta_visitor_id';

export const getVisitorId = (): string => {
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
};
