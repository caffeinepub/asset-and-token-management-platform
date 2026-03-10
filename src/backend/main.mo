import Time "mo:core/Time";
import List "mo:core/List";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";

actor {
  //////////////////////
  // TYPES

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

  public type AuditLog = {
    timestamp : Int;
    principal : Principal;
    action : Text;
    entity : Text;
  };

  public type ProjectRole = { #admin; #editor; #viewer };

  public type ProjectMember = {
    projectId : Nat;
    member : Principal;
    role : ProjectRole;
    addedAt : Int;
    addedBy : Principal;
  };

  public type SubscriptionTier = { #free; #starter; #pro };

  public type UserSubscription = {
    principal : Principal;
    tier : SubscriptionTier;
    updatedAt : Int;
  };

  public type PlatformConfig = {
    platformName : Text;
    tagline : Text;
    accentColor : Text;
  };

  ///////////////
  // STATE

  let projects = Map.empty<Nat, Project>();
  let assets = Map.empty<Nat, Asset>();
  let users = Map.empty<Nat, User>();
  let tasks = Map.empty<Nat, Task>();
  let collections = Map.empty<Nat, Collection>();
  let validationRules = Map.empty<Nat, ValidationRule>();
  let transitionRules = Map.empty<Nat, TransitionRule>();
  let mergeOperations = Map.empty<Nat, MergeOperation>();
  let tokens = Map.empty<Nat, Token>();
  let fileMetadata = Map.empty<Nat, FileMetadata>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let auditLogs = Map.empty<Nat, AuditLog>();
  let projectMembers = Map.empty<Text, ProjectMember>();
  let subscriptions = Map.empty<Principal, UserSubscription>();

  var nextProjectId = 1;
  var nextAssetId = 1;
  var nextUserId = 1;
  var nextTaskId = 1;
  var nextCollectionId = 1;
  var nextValidationRuleId = 1;
  var nextTransitionRuleId = 1;
  var nextMergeOperationId = 1;
  var nextTokenId = 1;
  var nextFileMetadataId = 1;
  var nextAuditLogId = 1;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  var stripeConfiguration : ?Stripe.StripeConfiguration = null;
  var platformConfig : ?PlatformConfig = null;

  //////////////////////
  // HELPER FUNCTIONS

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

  func appendAuditLog(caller : Principal, action : Text, entity : Text) {
    let logEntry : AuditLog = {
      timestamp = Time.now();
      principal = caller;
      action;
      entity;
    };
    auditLogs.add(nextAuditLogId, logEntry);
    nextAuditLogId += 1;
  };

  func makeMemberKey(projectId : Nat, principal : Principal) : Text {
    projectId.toText() # ":" # principal.toText();
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfiguration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  func countDistinctProjectIdsForCallerInternal(caller : Principal) : Nat {
    let allMembers = projectMembers.values().toArray();
    let callerMembers = allMembers.filter(func(pm) { pm.member == caller });

    // Count distinct project IDs
    var distinctProjects = Map.empty<Nat, Bool>();
    for (pm in callerMembers.vals()) {
      distinctProjects.add(pm.projectId, true);
    };

    distinctProjects.size();
  };

  ///////////////////////
  // AUDIT LOG QUERIES

  public query ({ caller }) func getCallerRole() : async Text {
    switch (AccessControl.getUserRole(accessControlState, caller)) {
      case (#admin) { "admin" };
      case (#user) { "user" };
      case (#guest) { "guest" };
    };
  };

  public query ({ caller }) func getAuditLogs(page : Nat, pageSize : Nat) : async {
    entries : [AuditLog];
    total : Nat;
  } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view audit logs");
    };

    let total = auditLogs.size();
    if (total == 0) {
      return { entries = []; total };
    };

    let offset = page * pageSize;
    if (offset >= total) {
      return { entries = []; total };
    };

    let sortedLogs = auditLogs.toArray();
    let range = sortedLogs.sliceToArray(offset, offset + pageSize : Nat);
    let entries = range.map(func((_, log)) { log });
    { entries; total };
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

  /////////////
  // USER & PROJECT CRUD

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

  public shared ({ caller }) func createProject(name : Text, description : Text) : async {
    #Ok : Nat;
    #Err : Text;
  } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can create projects");
    };

    validateProjectData(name, description);

    let numProjects = countDistinctProjectIdsForCallerInternal(caller);

    let tier = getEffectiveSubscriptionTier(caller);
    let maxProjects = switch (tier) {
      case (#pro) { 200 }; // Arbitrary high limit for Pro
      case (#starter) { 20 };
      case (#free) { 3 };
    };

    if (numProjects >= maxProjects) {
      return #Err("Too many projects for your subscription tier");
    };

    let project : Project = {
      id = nextProjectId;
      name;
      description;
      createdAt = Time.now();
      updatedAt = null;
    };

    projects.add(nextProjectId, project);
    appendAuditLog(caller, "createProject", "project:" # nextProjectId.toText());

    // Add caller as project member (admin role)
    let memberKey = makeMemberKey(nextProjectId, caller);
    let projectMember : ProjectMember = {
      projectId = nextProjectId;
      member = caller;
      role = #admin;
      addedAt = Time.now();
      addedBy = caller;
    };
    projectMembers.add(memberKey, projectMember);

    let projectId = nextProjectId;
    nextProjectId += 1;
    #Ok(projectId);
  };

  public query ({ caller }) func getProjectCountForCaller() : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can query their project count");
    };
    countDistinctProjectIdsForCallerInternal(caller);
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
        appendAuditLog(caller, "updateProject", "project:" # id.toText());
      };
    };
  };

  public shared ({ caller }) func deleteProject(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete projects");
    };
    if (projects.containsKey(id)) {
      projects.remove(id);
      appendAuditLog(caller, "deleteProject", "project:" # id.toText());
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
    appendAuditLog(caller, "createAsset", "asset:" # nextAssetId.toText());
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
        appendAuditLog(caller, "updateAsset", "asset:" # id.toText());
      };
    };
  };

  public shared ({ caller }) func deleteAsset(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete assets");
    };
    if (assets.containsKey(id)) {
      assets.remove(id);
      appendAuditLog(caller, "deleteAsset", "asset:" # id.toText());
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
    appendAuditLog(caller, "createTask", "task:" # nextTaskId.toText());
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
        appendAuditLog(caller, "updateTask", "task:" # id.toText());
      };
    };
  };

  public shared ({ caller }) func deleteTask(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete tasks");
    };
    if (tasks.containsKey(id)) {
      tasks.remove(id);
      appendAuditLog(caller, "deleteTask", "task:" # id.toText());
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
    appendAuditLog(caller, "createCollection", "collection:" # nextCollectionId.toText());
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
        appendAuditLog(caller, "updateCollection", "collection:" # id.toText());
      };
    };
  };

  public shared ({ caller }) func deleteCollection(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete collections");
    };
    if (collections.containsKey(id)) {
      collections.remove(id);
      appendAuditLog(caller, "deleteCollection", "collection:" # id.toText());
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

  public shared ({ caller }) func selfAssignAdmin() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be authenticated to self-assign admin");
    };
    if (accessControlState.adminAssigned) {
      Runtime.trap("Unauthorized: Admin has already been assigned");
    };
    accessControlState.userRoles.add(caller, #admin);
    accessControlState.adminAssigned := true;
    appendAuditLog(caller, "adminSelfAssign", "principal:" # caller.toText());
  };

  public shared ({ caller }) func mintToken(projectId : Nat, name : Text, description : Text, metadata : Text) : async {
    #Ok : Token;
    #Err : Text;
  } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #Err("Unauthorized: Only admins can mint tokens");
    };
    switch (projects.get(projectId)) {
      case (null) { return #Err("Project does not exist") };
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
        appendAuditLog(caller, "mintToken", "token:" # nextTokenId.toText());
        let tokenId = nextTokenId;
        nextTokenId += 1;
        #Ok(newToken);
      };
    };
  };

  public query ({ caller }) func getToken(tokenId : Nat) : async ?Token {
    tokens.get(tokenId);
  };

  public query ({ caller }) func listTokensByProject(projectId : Nat) : async [Token] {
    tokens.values().toArray().filter(func(token) { token.projectId == projectId });
  };

  /////////////////////
  // SUBSCRIPTION MANAGEMENT

  func getEffectiveSubscriptionTier(principal : Principal) : SubscriptionTier {
    switch (subscriptions.get(principal)) {
      case (?sub) { sub.tier };
      case (null) { #free };
    };
  };

  public query ({ caller }) func getMySubscription() : async ?UserSubscription {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their subscription");
    };
    subscriptions.get(caller);
  };

  public shared ({ caller }) func upgradeSubscription(tier : SubscriptionTier) : async {
    #Ok : ();
    #Err : Text;
  } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can upgrade subscriptions");
    };
    let newSubscription : UserSubscription = {
      principal = caller;
      tier;
      updatedAt = Time.now();
    };
    subscriptions.add(caller, newSubscription);
    appendAuditLog(caller, "upgradeSubscription", "principal:" # caller.toText());
    #Ok(());
  };

  /////////////////////
  // PLATFORM BRANDING CONFIG

  public query func getPlatformConfig() : async ?PlatformConfig {
    platformConfig;
  };

  public shared ({ caller }) func setPlatformConfig(config : PlatformConfig) : async {
    #Ok : ();
    #Err : Text;
  } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #Err("Unauthorized: Only admins can update platform configuration");
    };
    platformConfig := ?config;
    appendAuditLog(caller, "SET_PLATFORM_CONFIG", "platformConfig");
    #Ok(());
  };

  ////////////////////////
  // STRIPE INTEGRATION

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfiguration := ?config;
  };

  public query ({ caller }) func isStripeConfigured() : async Bool {
    stripeConfiguration != null;
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(
      getStripeConfiguration(),
      caller,
      items,
      successUrl,
      cancelUrl,
      transform,
    );
  };

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func handleStripePaymentCompleted(tier : SubscriptionTier, user : Principal) : async {
    #Ok : ();
    #Err : Text;
  } {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can post payment status updates");
    };
    let newSubscription : UserSubscription = {
      principal = user;
      tier;
      updatedAt = Time.now();
    };
    subscriptions.add(user, newSubscription);
    #Ok(());
  };
};
