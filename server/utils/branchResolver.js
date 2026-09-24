const resolveBranch = (result) => {
  if (!result) return null;

  if (result.branch === "true") {
    return "true";
  }

  if (result.branch === "false") {
    return "false";
  }

  return null;
};

const getOutgoingEdges = (
  edges,
  nodeId,
  branch = null
) => {
  const outgoing = edges.filter(
    (edge) => edge.source === nodeId
  );

  if (!branch) {
    return outgoing;
  }

  return outgoing.filter(
    (edge) =>
      edge.sourceHandle === branch ||
      edge.data?.branch === branch
  );
};

module.exports = {
  resolveBranch,
  getOutgoingEdges,
};