import Time "mo:core/Time";
import List "mo:core/List";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  public type Project = {
    id : Nat;
    name : Text;
    description : Text;
    createdAt : Time.Time;
    updatedAt : ?Time.Time;
  };

  public type Asset = {
    id : Nat;
    projectId : Nat;
    name : Text;
    description : Text;
    createdAt : Time.Time;
    updatedAt : ?Time.Time;
  };

  public type User = {
    id : Nat;
    principal : Principal;
    username : Text;
    createdAt : Time.Time;
  };

  public type AuditEntry = {
    id : Nat;
    timestamp : Time.Time;
    operation : Text;
    entityType : Text;
    entityId : Nat;
    userId : ?Nat;
    details : ?Text;
  };

  public type AuditLog = {
    timestamp : Int;
    principal : Principal;
    action : Text;
    entity : Text;
  };

  public type Task = {
    id : Nat;
    projectId : Nat;
    assetId : ?Nat;
    name : Text;
    description : Text;
    status : Text;
    assignedTo : ?Principal;
    createdAt : Int;
    updatedAt : Int;
    createdBy : Principal;
  };

  public type Collection = {
    id : Nat;
    projectId : Nat;
    name : Text;
    description : Text;
    assetIds : [Nat];
    createdAt : Int;
    updatedAt : Int;
    createdBy : Principal;
  };

  public type ValidationRule = {
    id : Nat;
    projectId : Nat;
    name : Text;
    ruleType : Text;
    conditions : Text;
    createdAt : Int;
    createdBy : Principal;
  };

  public type TransitionRule = {
    id : Nat;
    projectId : Nat;
    name : Text;
    fromStatus : Text;
    toStatus : Text;
    conditions : Text;
    createdAt : Int;
    createdBy : Principal;
  };

  public type MergeOperation = {
    id : Nat;
    projectId : Nat;
    sourceAssetIds : [Nat];
    targetAssetId : Nat;
    status : Text;
    createdAt : Int;
    completedAt : ?Int;
    createdBy : Principal;
  };

  public type Token = {
    id : Nat;
    projectId : Nat;
    name : Text;
    description : Text;
    mintedBy : Principal;
    mintedAt : Int;
    metadata : Text;
  };

  public type FileMetadata = {
    id : Nat;
    projectId : Nat;
    assetId : ?Nat;
    filename : Text;
    mimeType : Text;
    size : Nat;
    hash : Text;
    uploadedBy : Principal;
    uploadedAt : Int;
  };

  public type UserProfile = {
    name : Text;
    username : Text;
  };

  let projects = Map.empty<Nat, Project>();
  let assets = Map.empty<Nat, Asset>();
  let users = Map.empty<Nat, User>();
  let auditEntries = Map.empty<Nat, AuditEntry>();
  let auditLogs = Map.empty<Nat, AuditLog>();
  let tasks = Map.empty<Nat, Task>();
  let collections = Map.empty<Nat, Collection>();
  let validationRules = Map.empty<Nat, ValidationRule>();
  let transitionRules = Map.empty<Nat, TransitionRule>();
  let mergeOperations = Map.empty<Nat, MergeOperation>();
  let tokens = Map.empty<Nat, Token>();
  let fileMetadata = Map.empty<Nat, FileMetadata>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextProjectId = 1;
  var nextAssetId = 1;
  var nextUserId = 1;
  var nextAuditId = 1;
  var nextAuditLogId = 1;
  var nextTaskId = 1;
  var nextCollectionId = 1;
  var nextValidationRuleId = 1;
  var nextTransitionRuleId = 1;
  var nextMergeOperationId = 1;
  var nextTokenId = 1;
  var nextFileMetadataId = 1;

  type ProjectRole = { #admin; #editor; #viewer };

  type ProjectMember = {
    projectId : Nat;
    member : Principal;
    role : ProjectRole;
    addedAt : Int;
    addedBy : Principal;
  };

  let projectMembers = Map.empty<Text, ProjectMember>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  func validateProjectData(name : Text, _description : Text) {
    if (name.size() == 0) {
      Runtime.trap("Project name cannot be empty");
    };
  };

  func validateAssetData(projectId : Nat, name : Text, _description : Text) {
    if (name.size() == 0) {
      Runtime.trap("Asset name cannot be empty");
    };
    if (not projects.containsKey(projectId)) {
      Runtime.trap("Invalid project reference");
    };
  };

  func createAuditEntry(operation : Text, entityType : Text, entityId : Nat, userId : ?Nat, details : ?Text) {
    let auditEntry : AuditEntry = {
      id = nextAuditId;
      timestamp = Time.now();
      operation;
      entityType;
      entityId;
      userId;
      details;
    };
    auditEntries.add(nextAuditId, auditEntry);
    nextAuditId += 1;
  };

  ///////////////////////
  // USER PROFILE MANAGEMENT (required by frontend)

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // AUDIT LOG PAGINATION
  public shared ({ caller }) func getAuditLogs(page : Nat, pageSize : Nat) : async {
    entries : [AuditLog];
    total : Nat;
  } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access audit logs");
    };
    let total = auditLogs.size();
    let skip = page * pageSize;
    if (skip >= total or pageSize == 0) {
      return {
        entries = [];
        total;
      };
    };
    let entries = List.empty<AuditLog>();
    let start = skip + 1;
    let end = start + pageSize;
    var count = 0;
    for ((id, log) in auditLogs.entries()) {
      if (id >= start and id < end) {
        entries.add(log);
        count += 1;
      };
      if (count >= pageSize) { return { entries = entries.toArray(); total } };
    };
    {
      entries = entries.toArray();
      total;
    };
  };

  // getCallerRole: any principal (including guests) may query their own role.
  // No authorization check needed.
  public query ({ caller }) func getCallerRole() : async Text {
    let role = AccessControl.getUserRole(accessControlState, caller);
    switch (role) {
      case (#admin) { "admin" };
      case (#user) { "user" };
      case (#guest) { "guest" };
    };
  };

  ///////////////////////
  // Global querying (read-only, open to all)

  public query ({ caller }) func getProject(id : Nat) : async ?Project {
    projects.get(id);
  };

  public query ({ caller }) func listProjects() : async [Project] {
    projects.values().toArray();
  };

  public query ({ caller }) func getAsset(id : Nat) : async ?Asset {
    assets.get(id);
  };

  public query ({ caller }) func listAssets() : async [Asset] {
    assets.values().toArray();
  };

  public query ({ caller }) func listAssetsByProject(projectId : Nat) : async [Asset] {
    assets.values().toArray().filter(func(asset) { asset.projectId == projectId });
  };

  public query ({ caller }) func getTask(id : Nat) : async ?Task {
    tasks.get(id);
  };

  public query ({ caller }) func listTasksByProject(projectId : Nat) : async [Task] {
    tasks.values().toArray().filter(func(task) { task.projectId == projectId });
  };

  public query ({ caller }) func getCollection(id : Nat) : async ?Collection {
    collections.get(id);
  };

  public query ({ caller }) func listCollectionsByProject(projectId : Nat) : async [Collection] {
    collections.values().toArray().filter(func(collection) { collection.projectId == projectId });
  };

  public query ({ caller }) func getValidationRule(id : Nat) : async ?ValidationRule {
    validationRules.get(id);
  };

  public query ({ caller }) func listValidationRulesByProject(projectId : Nat) : async [ValidationRule] {
    validationRules.values().toArray().filter(func(rule) { rule.projectId == projectId });
  };

  public query ({ caller }) func getTransitionRule(id : Nat) : async ?TransitionRule {
    transitionRules.get(id);
  };

  public query ({ caller }) func listTransitionRulesByProject(projectId : Nat) : async [TransitionRule] {
    transitionRules.values().toArray().filter(func(rule) { rule.projectId == projectId });
  };

  public query ({ caller }) func getMergeOperation(id : Nat) : async ?MergeOperation {
    mergeOperations.get(id);
  };

  public query ({ caller }) func listMergeOperationsByProject(projectId : Nat) : async [MergeOperation] {
    mergeOperations.values().toArray().filter(func(operation) { operation.projectId == projectId });
  };

  public query ({ caller }) func getFileMetadata(id : Nat) : async ?FileMetadata {
    fileMetadata.get(id);
  };

  public query ({ caller }) func listFileMetadataByAsset(assetId : Nat) : async [FileMetadata] {
    let filtered = fileMetadata.toArray().filter(
      func((_, meta)) {
        switch (meta.assetId) {
          case (?aid) { aid == assetId };
          case (null) { false };
        };
      }
    );
    filtered.map(func((_, meta)) { meta });
  };

  ///////////////
  // AUTHORIZATION HELPERS

  func makeMemberKey(projectId : Nat, principal : Principal) : Text {
    projectId.toText() # ":" # principal.toText();
  };

  /////////////
  // USER & PROJECT CRUD

  // Self-registration: requires #user role (authenticated, non-guest)
  public shared ({ caller }) func registerUser(username : Text) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can register");
    };
    let newUser : User = {
      id = nextUserId;
      principal = caller;
      username;
      createdAt = Time.now();
    };
    users.add(nextUserId, newUser);
    let userId = nextUserId;
    nextUserId += 1;
    userId;
  };

  // Project mutations: require #user role minimum
  public shared ({ caller }) func createProject(name : Text, description : Text) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can create projects");
    };
    validateProjectData(name, description);
    let project : Project = {
      id = nextProjectId;
      name;
      description;
      createdAt = Time.now();
      updatedAt = null;
    };
    projects.add(nextProjectId, project);
    createAuditEntry("create", "project", nextProjectId, null, null);
    let projectId = nextProjectId;
    nextProjectId += 1;
    projectId;
  };

  public shared ({ caller }) func updateProject(id : Nat, name : Text, description : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can update projects");
    };
    validateProjectData(name, description);
    switch (projects.get(id)) {
      case (null) { Runtime.trap("Project not found") };
      case (?existingProject) {
        let updatedProject : Project = {
          id;
          name;
          description;
          createdAt = existingProject.createdAt;
          updatedAt = ?Time.now();
        };
        projects.add(id, updatedProject);
        createAuditEntry("update", "project", id, null, null);
      };
    };
  };

  // Delete project: admin only
  public shared ({ caller }) func deleteProject(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete projects");
    };
    if (projects.containsKey(id)) {
      projects.remove(id);
      createAuditEntry("delete", "project", id, null, null);
    } else {
      Runtime.trap("Project not found");
    };
  };

  /////////////
  // ASSET MGMT

  public shared ({ caller }) func createAsset(projectId : Nat, name : Text, description : Text) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can create assets");
    };
    validateAssetData(projectId, name, description);
    let asset : Asset = {
      id = nextAssetId;
      projectId;
      name;
      description;
      createdAt = Time.now();
      updatedAt = null;
    };
    assets.add(nextAssetId, asset);
    createAuditEntry("create", "asset", nextAssetId, null, null);
    let assetId = nextAssetId;
    nextAssetId += 1;
    assetId;
  };

  public shared ({ caller }) func updateAsset(id : Nat, name : Text, description : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can update assets");
    };
    switch (assets.get(id)) {
      case (null) { Runtime.trap("Asset not found") };
      case (?existingAsset) {
        validateAssetData(existingAsset.projectId, name, description);
        let updatedAsset : Asset = {
          id;
          projectId = existingAsset.projectId;
          name;
          description;
          createdAt = existingAsset.createdAt;
          updatedAt = ?Time.now();
        };
        assets.add(id, updatedAsset);
        createAuditEntry("update", "asset", id, null, null);
      };
    };
  };

  // Delete asset: admin only
  public shared ({ caller }) func deleteAsset(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete assets");
    };
    if (assets.containsKey(id)) {
      assets.remove(id);
      createAuditEntry("delete", "asset", id, null, null);
    } else {
      Runtime.trap("Asset not found");
    };
  };

  //////////////
  // TASK MGMT

  public shared ({ caller }) func createTask(projectId : Nat, assetId : ?Nat, name : Text, description : Text, status : Text, assignedTo : ?Principal) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can create tasks");
    };
    if (name.size() == 0) {
      Runtime.trap("Task name cannot be empty");
    };
    if (not projects.containsKey(projectId)) {
      Runtime.trap("Invalid project reference");
    };
    let newTask : Task = {
      id = nextTaskId;
      projectId;
      assetId;
      name;
      description;
      status;
      assignedTo;
      createdAt = Time.now();
      updatedAt = Time.now();
      createdBy = caller;
    };
    tasks.add(nextTaskId, newTask);
    createAuditEntry("create", "task", nextTaskId, null, null);
    let taskId = nextTaskId;
    nextTaskId += 1;
    taskId;
  };

  public shared ({ caller }) func updateTask(id : Nat, name : Text, description : Text, status : Text, assignedTo : ?Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can update tasks");
    };
    switch (tasks.get(id)) {
      case (null) { Runtime.trap("Task not found") };
      case (?existingTask) {
        let updatedTask : Task = {
          existingTask with
          name;
          description;
          status;
          assignedTo;
          updatedAt = Time.now();
        };
        tasks.add(id, updatedTask);
        createAuditEntry("update", "task", id, null, null);
      };
    };
  };

  // Delete task: admin only
  public shared ({ caller }) func deleteTask(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete tasks");
    };
    if (tasks.containsKey(id)) {
      tasks.remove(id);
      createAuditEntry("delete", "task", id, null, null);
    } else {
      Runtime.trap("Task not found");
    };
  };

  ///////////////
  // COLLECTIONS

  public shared ({ caller }) func createCollection(projectId : Nat, name : Text, description : Text, assetIds : [Nat]) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can create collections");
    };
    if (name.size() == 0) {
      Runtime.trap("Collection name cannot be empty");
    };
    if (not projects.containsKey(projectId)) {
      Runtime.trap("Invalid project reference");
    };
    let newCollection : Collection = {
      id = nextCollectionId;
      projectId;
      name;
      description;
      assetIds;
      createdAt = Time.now();
      updatedAt = Time.now();
      createdBy = caller;
    };
    collections.add(nextCollectionId, newCollection);
    createAuditEntry("create", "collection", nextCollectionId, null, null);
    let collectionId = nextCollectionId;
    nextCollectionId += 1;
    collectionId;
  };

  public shared ({ caller }) func updateCollection(id : Nat, name : Text, description : Text, assetIds : [Nat]) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can update collections");
    };
    switch (collections.get(id)) {
      case (null) { Runtime.trap("Collection not found") };
      case (?existingCollection) {
        let updatedCollection : Collection = {
          existingCollection with
          name;
          description;
          assetIds;
          updatedAt = Time.now();
        };
        collections.add(id, updatedCollection);
        createAuditEntry("update", "collection", id, null, null);
      };
    };
  };

  // Delete collection: admin only
  public shared ({ caller }) func deleteCollection(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete collections");
    };
    if (collections.containsKey(id)) {
      collections.remove(id);
      createAuditEntry("delete", "collection", id, null, null);
    } else {
      Runtime.trap("Collection not found");
    };
  };

  ////////////////////////
  // PROJECT MEMBER ROLES (admin only for mutations)

  public shared ({ caller }) func addProjectMember(projectId : Nat, member : Principal, role : ProjectRole) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add project members");
    };
    let key = makeMemberKey(projectId, member);
    let projectMember : ProjectMember = {
      projectId;
      member;
      role;
      addedAt = Time.now();
      addedBy = caller;
    };
    projectMembers.add(key, projectMember);
  };

  public query ({ caller }) func getProjectMember(projectId : Nat, member : Principal) : async ?ProjectMember {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view project members");
    };
    let key = makeMemberKey(projectId, member);
    projectMembers.get(key);
  };

  public query ({ caller }) func listMembersByProject(projectId : Nat) : async [ProjectMember] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can list project members");
    };
    var memberList = List.empty<ProjectMember>();
    for ((key, member) in projectMembers.entries()) {
      if (key.startsWith(#text(projectId.toText() # ":"))) {
        memberList.add(member);
      };
    };
    memberList.toArray();
  };

  public shared ({ caller }) func updateProjectMemberRole(projectId : Nat, member : Principal, newRole : ProjectRole) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update project member roles");
    };
    let key = makeMemberKey(projectId, member);
    switch (projectMembers.get(key)) {
      case (null) { Runtime.trap("Project member not found") };
      case (?existingMember) {
        let updatedMember : ProjectMember = {
          existingMember with role = newRole;
        };
        projectMembers.add(key, updatedMember);
      };
    };
  };

  public shared ({ caller }) func removeProjectMember(projectId : Nat, member : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can remove project members");
    };
    let key = makeMemberKey(projectId, member);
    if (projectMembers.containsKey(key)) {
      projectMembers.remove(key);
    } else {
      Runtime.trap("Project member not found");
    };
  };

  ////////////////////////
  // SELF ADMIN ASSIGNMENT

  /// Allows admins to assign themselves as admin to a project, asset, task, or collection.
  /// This function is restricted to admins only to prevent privilege escalation.
  public shared ({ caller }) func selfAssignAdmin(entityId : Nat) : async () {
    // FIXED: Require admin permission instead of just user permission
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can call selfAssignAdmin");
    };
    let hasAnyEntity = switch (projects.get(entityId)) {
      case (?_) { true };
      case (null) {
        switch (assets.get(entityId)) {
          case (?_) { true };
          case (null) {
            switch (tasks.get(entityId)) {
              case (?_) { true };
              case (null) { collections.containsKey(entityId) };
            };
          };
        };
      };
    };
    if (not hasAnyEntity) {
      Runtime.trap("Entity not found: no project, asset, task, or collection with this ID");
    };
    let key = makeMemberKey(entityId, caller);
    let projectMember : ProjectMember = {
      projectId = entityId;
      member = caller;
      role = #admin;
      addedAt = Time.now();
      addedBy = caller;
    };
    projectMembers.add(key, projectMember);
    let logEntry : AuditLog = {
      timestamp = Time.now();
      principal = caller;
      action = "adminSelfAssign";
      entity = entityId.toText();
    };
    auditLogs.add(nextAuditLogId, logEntry);
    nextAuditLogId += 1;
  };

  /////////////////////////////
  // FILE & METADATA MGMT
  public shared ({ caller }) func storeFileMetadata(projectId : Nat, assetId : ?Nat, filename : Text, mimeType : Text, size : Nat, hash : Text) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can store file metadata");
    };
    let fileMeta : FileMetadata = {
      id = nextFileMetadataId;
      projectId;
      assetId;
      filename;
      mimeType;
      size;
      hash;
      uploadedBy = caller;
      uploadedAt = Time.now();
    };
    fileMetadata.add(nextFileMetadataId, fileMeta);
    let fileId = nextFileMetadataId;
    nextFileMetadataId += 1;
    fileId;
  };

  // Delete file metadata: admin only
  public shared ({ caller }) func deleteFileMetadata(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete file metadata");
    };
    if (fileMetadata.containsKey(id)) {
      fileMetadata.remove(id);
    } else {
      Runtime.trap("File metadata not found");
    };
  };

  ///////////////////////////
  // TOKEN MANAGEMENT

  // mintToken: admin only
  public shared ({ caller }) func mintToken(projectId : Nat, name : Text, description : Text, metadata : Text) : async {
    #ok : Token;
    #err : Text;
  } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can mint tokens");
    };
    switch (projects.get(projectId)) {
      case (null) { return #err("Project does not exist") };
      case (?_) {
        let newToken : Token = {
          id = nextTokenId;
          projectId;
          name;
          description;
          mintedBy = caller;
          mintedAt = Time.now();
          metadata;
        };
        tokens.add(nextTokenId, newToken);
        createAuditEntry("mint", "token", nextTokenId, null, ?description);
        let tokenId = nextTokenId;
        nextTokenId += 1;
        #ok(newToken);
      };
    };
  };

  public query ({ caller }) func getToken(tokenId : Nat) : async ?Token {
    tokens.get(tokenId);
  };

  public query ({ caller }) func listTokensByProject(projectId : Nat) : async [Token] {
    tokens.values().toArray().filter(func(token) { token.projectId == projectId });
  };
};
